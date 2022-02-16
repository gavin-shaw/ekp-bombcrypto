import {
  ClientStateChangedEvent,
  collection,
  filterPath,
  parseCurrency,
} from '@earnkeeper/ekp-sdk';
import {
  ClientService,
  CoingeckoService,
  TransactionService,
} from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import moment from 'moment';
import { filter } from 'rxjs';
import { IntroDocument } from './intro.document';

const FILTER_PATH = '/plugin/bombcrypto/intro';
const COLLECTION_NAME = collection(IntroDocument);

@Injectable()
export class IntroService {
  constructor(
    private clientService: ClientService,
    private coingeckoService: CoingeckoService,
    private transactionService: TransactionService,
  ) {
    this.clientService.clientStateEvents$
      .pipe(
        filter((event: ClientStateChangedEvent) =>
          filterPath(event, FILTER_PATH),
        ),
      )
      .subscribe((event) => {
        this.handleClientStateEvent(event);
      });
  }

  async handleClientStateEvent(
    clientStateChangedEvent: ClientStateChangedEvent,
  ) {
    const currency = parseCurrency(clientStateChangedEvent);
    const bcoinPrice = await this.coingeckoService
      .latestPricesOf(['bomber-coin'], currency.id)
      .then((it) => it[0]);

    const bcoinTransactions = await this.transactionService.transactionModel
      .find()
      .limit(1);

    // const [bcoinTokenTransfers] = await Promise.all([
    //   this.transactionService.contractTokenTransfersOf(
    //     'bsc',
    //     BCOIN_CONTRACT_ADDRESS,
    //   ),
    // ]);

    const firstTransfer = _.chain(bcoinTransactions)
      .sortBy('blockTimestamp')
      .first()
      .value();

    const firstTransferMoment = moment.unix(firstTransfer.blockTimestamp);

    const documents: IntroDocument[] = [
      {
        id: COLLECTION_NAME,
        biggestLoserAmount: 0,
        biggestWinnerAmount: 0,
        bcoinPrice: bcoinPrice.price,
        earnAmount: 0.008 * bcoinPrice.price,
        earnEvery: '2 hrs',
        earnPerDay: 0.008 * bcoinPrice.price * 12,
        fiatSymbol: currency.symbol,
        gameUpTime: firstTransferMoment.fromNow(),
        heroNftPrice: 10 * bcoinPrice.price,
        numPlayers: 30550,
        sendYourHeroEvery: '30 mins',
      },
    ];
    await this.clientService.emitDocuments(
      clientStateChangedEvent,
      COLLECTION_NAME,
      documents,
    );
  }
}
