import {
  ClientStateChangedEvent,
  collection,
  NULL_ADDRESS,
} from '@earnkeeper/ekp-sdk';
import { ClientService } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { BombcryptoWallet, BombcryptoWalletRepository } from '../../db';
import {
  BOMB_CRYPTO_DEPLOYER_ADDRESS,
  KIPS_LOCKED_WALLET_ADDRESS,
  PANCAKE_SWAP_BCOIN_BUSD_ADDRESS,
} from '../../util';
import { WalletDocument } from './wallet.document';

const COLLECTION_NAME = collection(WalletDocument);

@Injectable()
export class LeaderboardService {
  constructor(
    private clientService: ClientService,
    private walletRepository: BombcryptoWalletRepository,
  ) {
    this.clientService.clientStateEvents$.subscribe((event) => {
      this.handleClientStateEvent(event);
    });
  }

  async handleClientStateEvent(
    clientStateChangedEvent: ClientStateChangedEvent,
  ) {
    await this.clientService.emitBusy(clientStateChangedEvent, COLLECTION_NAME);

    const wallets = await this.walletRepository.findAllWalletsByBlockHeight();

    const walletDocuments = this.mapWalletDocuments(wallets);

    await this.clientService.emitDocuments(
      clientStateChangedEvent,
      COLLECTION_NAME,
      walletDocuments,
    );

    await this.clientService.emitDone(clientStateChangedEvent, COLLECTION_NAME);
  }

  mapWalletDocuments(wallets: BombcryptoWallet[]): WalletDocument[] {
    return _.chain(wallets)
      .filter(
        (wallet) =>
          ![
            NULL_ADDRESS,
            PANCAKE_SWAP_BCOIN_BUSD_ADDRESS,
            KIPS_LOCKED_WALLET_ADDRESS,
            BOMB_CRYPTO_DEPLOYER_ADDRESS,
          ].includes(wallet.address),
      )
      .map((wallet) => ({
        address: wallet.address,
        balance: wallet.balance,
        buy: wallet.buy,
        buyUsd: wallet.buyUsd,
        fiatSymbol: '$',
        id: wallet.address,
        net: wallet.sell - wallet.buy,
        netUsd: wallet.sellUsd - wallet.buyUsd,
        sell: wallet.sell,
        sellUsd: wallet.sellUsd,
        startTimestamp: wallet.startTimestamp,
        updated: wallet.endTimestamp,
      }))
      .sortBy('netUsd')
      .reverse()
      .take(500)
      .value();
  }
}
