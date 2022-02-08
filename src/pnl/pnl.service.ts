import {
  chains,
  ClientService,
  ClientStateChangedEvent,
  collection,
  FiatPrice,
  filterPath,
  MoralisService,
  parseClientAddresses,
  parseCurrency,
  PriceService,
  TokenMetadata,
  TokenTransfer,
  Transaction,
  TransactionService,
} from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import _ from 'lodash';
import moment from 'moment';
import { distinct, filter, from, mergeMap, of, toArray } from 'rxjs';
import { BCOIN_CONTRACT_ADDRESS, BOMB_CONTRACT_ADDRESSES } from '../util';
import {
  BHERO_CONTRACT_ADDRESS,
  BHOUSE_CONTRACT_ADDRESS,
} from '../util/constants';
import { PnlDocument } from './pnl.document';

const FILTER_PATH = '/plugin/bombcrypto/pnl';
const COLLECTION_NAME = collection(PnlDocument);

@Injectable()
export class PnlService {
  constructor(
    private clientService: ClientService,
    private moralisService: MoralisService,
    private transactionService: TransactionService,
    private priceService: PriceService,
  ) {
    // Subscribe to all client state changes from all clients
    this.clientService.clientStateEvents$
      .pipe(
        // Only process events for clients looking at the pnl
        // (save resources)
        filter((event) => filterPath(event, FILTER_PATH)),
      )
      .subscribe((event) => {
        // Handle the event
        this.handleClientStateEvent(event);
      });
  }

  async handleClientStateEvent(
    clientStateChangedEvent: ClientStateChangedEvent,
  ) {
    // Tell the client we are busy updating
    await this.clientService.emitBusy(clientStateChangedEvent, COLLECTION_NAME);

    // Get all wallet token transfers for all watched addresses
    // Don't worry, the fetch calls are smart cached by the sdk,
    // It won't fetch all transfers every time
    const addressTokenTxs = await this.fetchAddressTokenTransfers(
      clientStateChangedEvent,
    );

    // Filter to only bomb crypto transfers
    const bcTokenTxs = addressTokenTxs.filter(
      (it) => BCOIN_CONTRACT_ADDRESS === it.tokenAddress,
    );

    // Create a maps of transfers for efficient query later
    const bcTokenTransferMap = _.chain(bcTokenTxs)
      .groupBy('transactionHash')
      .value();

    // Create a maps of transfers for efficient query later
    const tokenTransfersMap = _.chain(addressTokenTxs)
      .groupBy('transactionHash')
      .value();

    // Get all wallet transactions for all watched addresses
    const addressTxs = await this.fetchAddressTransactions(
      clientStateChangedEvent,
    );

    // Filter to only bomb crypto transactions
    const bcTxs = addressTxs.filter(
      (tx) =>
        BOMB_CONTRACT_ADDRESSES.includes(tx.toAddress) ||
        BOMB_CONTRACT_ADDRESSES.includes(tx.fromAddress) ||
        !!bcTokenTransferMap[tx.hash],
    );

    // Get the historic prices of bnb
    const bnbPrices = await this.getBnbPrices(clientStateChangedEvent);

    // Get historic prices of bcoin
    const bcoinPrices = await this.getBcoinPrices(clientStateChangedEvent);

    // Get all token metadata
    const tokenMetadatas = await this.getTokenMetadatas(addressTokenTxs);

    // Map the documents (try not to spend too long processing and stall the event loop)
    const documents = this.mapDocuments(
      clientStateChangedEvent,
      bcTxs,
      tokenTransfersMap,
      bnbPrices,
      bcoinPrices,
      tokenMetadatas,
    );

    // Emit the documents
    await this.clientService.emitDocuments(
      clientStateChangedEvent,
      COLLECTION_NAME,
      documents,
    );

    // Tell the client we are done updating
    await this.clientService.emitDone(clientStateChangedEvent, COLLECTION_NAME);
  }

  getTokenMetadatas(
    addressTokenTxs: TokenTransfer[],
  ): Promise<TokenMetadata[]> {
    return from(addressTokenTxs)
      .pipe(
        filter((tx) => !!tx.tokenAddress),
        distinct((tx) => tx.tokenAddress),
        mergeMap((tx: TokenTransfer) =>
          this.moralisService.tokenMetadataOf('bsc', tx.tokenAddress),
        ),
        toArray(),
      )
      .toPromise();
  }

  /**
   * Fetch all transactions for all client wallets, flattened together
   *
   * @param clientStateChangedEvent event containing client details
   * @returns list of transactions
   */
  async fetchAddressTransactions(
    clientStateChangedEvent: ClientStateChangedEvent,
  ): Promise<Transaction[]> {
    // Use rxjs here as it is easier to show in a functional style when collecting promises
    return of(clientStateChangedEvent)
      .pipe(
        // Flatten client state into watched addresses
        mergeMap((event: ClientStateChangedEvent) =>
          parseClientAddresses(event),
        ),
        // Process each address as a promise
        mergeMap((address) =>
          this.transactionService.transactionsOf('bsc', address),
        ),
        // Flatten transactions from each address
        mergeMap((txs: Transaction[]) => txs),
        // Collect into a single array
        toArray(),
      )
      .toPromise(); // This is deprecated, but until pipelines hit node js, this is easier to read than the alternative
  }

  /**
   * Fetch all token transfers for all client wallets, flattened together
   *
   * @param clientStateChangedEvent event containing client details
   * @returns list of token transfers
   */
  async fetchAddressTokenTransfers(
    clientStateChangedEvent: ClientStateChangedEvent,
  ): Promise<TokenTransfer[]> {
    // Use rxjs here as it is easier to show in a functional style when collecting promises
    return of(clientStateChangedEvent)
      .pipe(
        // Flatten client state into watched addresses
        mergeMap((event: ClientStateChangedEvent) =>
          parseClientAddresses(event),
        ),
        // Process each address as a promise
        mergeMap((address) =>
          this.transactionService.tokenTransfersOf('bsc', address),
        ),
        // Flatten transfers from each address
        mergeMap((txs: TokenTransfer[]) => txs),
        // Collect into a single array
        toArray(),
      )
      .toPromise();
  }

  /**
   * Filter wallet transactions and map them into the display document
   *
   * @param transactions wallet transactions
   * @param bcoinPrice bcoin price in bnb
   * @returns mapped display documents
   */
  mapDocuments(
    clientStateChangedEvent: ClientStateChangedEvent,
    transactions: Transaction[],
    tokenTransferMap: { [transactionHash: string]: TokenTransfer[] },
    bnbPrices: FiatPrice[],
    bcoinPrices: FiatPrice[],
    tokenMetadatas: TokenMetadata[],
  ): PnlDocument[] {
    const bnbPriceMap = _.chain(bnbPrices)
      .groupBy('timestamp')
      .mapValues((values) => values[0])
      .value();

    const bcoinPriceMap = _.chain(bcoinPrices)
      .groupBy('timestamp')
      .mapValues((values) => values[0])
      .value();

    const tokenMetadataMap = _.chain(tokenMetadatas)
      .groupBy('address')
      .mapValues((values) => values[0])
      .value();

    return (
      transactions
        // Map to display documents
        .map((tx) => {
          const tokenTransfers = tokenTransferMap[tx.hash];
          const firstTokenTransfer = tokenTransfers
            ? tokenTransfers[0]
            : undefined;

          // Skip setApprovalForAll
          if (
            tx.input.startsWith('0xa22cb465') ||
            tx.input.startsWith('0x095ea7b3') ||
            tx.input.startsWith('0x39509351')
          ) {
            return undefined;
          }

          let action: string;
          let actionTooltip: string;
          let bcoinValue: number;
          let pnlFiatValue: number;
          let costBasisFiat: number;
          let realizedValueFiat: number;

          const txDay = moment
            .unix(tx.blockTimestamp)
            .utc()
            .startOf('day')
            .unix()
            .toString();

          const bnbCoinPrice = bnbPriceMap[txDay];

          let bnbPrice: number;

          if (!!bnbCoinPrice) {
            bnbPrice = bnbCoinPrice.price;
          }

          const bcoinCoinPrice = bcoinPriceMap[txDay];

          let bcoinFiatPrice: number;

          if (!!bcoinCoinPrice) {
            bcoinFiatPrice = bcoinCoinPrice.price;
          }

          // BHERO processTokenRequest()
          if (
            tx.input.startsWith('0x5238faf3') &&
            tx.toAddress === BHERO_CONTRACT_ADDRESS
          ) {
            action = 'Receive Heroes';
          }

          // BHERO mint()
          if (
            tx.input.startsWith('0xa0712d68') &&
            tx.toAddress === BHERO_CONTRACT_ADDRESS
          ) {
            action = 'Mint Heroes';

            bcoinValue =
              -1 * Number(ethers.utils.formatEther(firstTokenTransfer.value));
          }

          // BHOUSE mint()
          if (
            tx.input.startsWith('0xa0712d68') &&
            tx.toAddress === BHOUSE_CONTRACT_ADDRESS
          ) {
            action = 'Mint Houses';
          }

          // BCOIN transfer()
          if (
            tx.input.startsWith('0xa9059cbb') &&
            tx.toAddress === BCOIN_CONTRACT_ADDRESS
          ) {
            action = 'Transfer BCOIN';
          }

          // BHERO upgrade()
          if (
            tx.input.startsWith('0x451450ec') &&
            tx.toAddress === BHERO_CONTRACT_ADDRESS
          ) {
            action = 'Upgrade BHERO';
          }

          // BHERO claim()
          if (
            tx.input.startsWith('0x4e71d92d') &&
            tx.toAddress === BHERO_CONTRACT_ADDRESS
          ) {
            action = 'Claim Heroes';
          }

          // BCOIN claim()
          if (
            tx.input.startsWith('0x23b872dd') &&
            tx.toAddress === BCOIN_CONTRACT_ADDRESS
          ) {
            action = 'Claim BCOIN';
          }

          // Pancakeswap token to token
          if (
            tx.input.startsWith('0x38ed1739') ||
            tx.input.startsWith('0x5c11d795')
          ) {
            const token1Address = tokenTransfers[0].tokenAddress;
            const token2Address = tokenTransfers[1].tokenAddress;
            const token1Name = tokenMetadataMap[token1Address]?.symbol ?? '?';
            const token2Name = tokenMetadataMap[token2Address]?.symbol ?? '?';

            action = `Swap ${token1Name} for ${token2Name}`;
            actionTooltip = action;

            if (token1Address === BCOIN_CONTRACT_ADDRESS) {
              bcoinValue =
                -1 * Number(ethers.utils.formatEther(tokenTransfers[0].value));
              realizedValueFiat = (realizedValueFiat || 0) + pnlFiatValue;
            } else if (token2Address === BCOIN_CONTRACT_ADDRESS) {
              bcoinValue = Number(
                ethers.utils.formatEther(tokenTransfers[1].value),
              );
              pnlFiatValue = -1 * bcoinValue * bcoinFiatPrice;
              costBasisFiat = (costBasisFiat || 0) + Math.abs(pnlFiatValue);
            }
          }

          // Pancakeswap bnb to bcoin
          if (
            tx.input.startsWith('0xfb3bdb41') &&
            tokenTransfers[0].tokenAddress === BCOIN_CONTRACT_ADDRESS
          ) {
            action = `Swap BNB for BCOIN`;
            actionTooltip = action;

            bcoinValue = Number(
              ethers.utils.formatEther(tokenTransfers[0].value),
            );

            pnlFiatValue = -1 * bcoinValue * bcoinFiatPrice;
            costBasisFiat = (costBasisFiat || 0) + Math.abs(pnlFiatValue);
          }

          // Pancakeswap bcoin to bnb
          if (
            tx.input.startsWith('0x791ac947') &&
            tokenTransfers[0].tokenAddress === BCOIN_CONTRACT_ADDRESS
          ) {
            action = `Swap BCOIN for BNB`;
            actionTooltip = action;

            bcoinValue =
              -1 * Number(ethers.utils.formatEther(tokenTransfers[0].value));

            pnlFiatValue = -1 * bcoinValue * bcoinFiatPrice;
            realizedValueFiat = (realizedValueFiat || 0) + pnlFiatValue;
          }

          const gasBnbValue = tx.gasPrice * tx.receiptGasUsed;
          const gasFiatValue = gasBnbValue * bnbPrice;

          pnlFiatValue -= gasFiatValue;

          const document: PnlDocument = {
            action,
            actionTooltip,
            bcoinValue,
            block: Number(tx.blockNumber),
            costBasisFiat,
            fiatSymbol: parseCurrency(clientStateChangedEvent)?.symbol,
            gasBnbValue,
            gasFiatValue,
            id: tx.hash,
            ownerAddress: tx.ownerAddress,
            ownerChain: 'bsc',
            pnlFiatValue,
            realizedValueFiat,
            timestamp: tx.blockTimestamp,
            txlink: `${chains['bsc'].explorer}/tx/${tx.hash}`,
            updated: moment().unix(),
          };

          return document;
        })
        .filter((it) => !!it)
    );
  }

  getBnbPrices(
    clientStateChangedEvent: ClientStateChangedEvent,
  ): Promise<FiatPrice[]> {
    return this.priceService.dailyFiatPricesOf(
      'bsc',
      chains['bsc'].token.address,
      parseCurrency(clientStateChangedEvent)?.id,
    );
  }

  async getBcoinPrices(
    clientStateChangedEvent: ClientStateChangedEvent,
  ): Promise<FiatPrice[]> {
    return this.priceService.dailyFiatPricesOf(
      'bsc',
      BCOIN_CONTRACT_ADDRESS,
      parseCurrency(clientStateChangedEvent)?.id,
    );
  }
}
