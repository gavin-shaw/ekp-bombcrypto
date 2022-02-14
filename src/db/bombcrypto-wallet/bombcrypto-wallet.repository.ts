import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { validate } from 'bycontract';
import _ from 'lodash';
import { Model } from 'mongoose';
import {
  BombcryptoWallet,
  BombcryptoWalletDocument,
} from './bombcrypto-wallet.schema';

@Injectable()
export class BombcryptoWalletRepository {
  constructor(
    @InjectModel(BombcryptoWallet.name)
    private bombcryptoWalletModel: Model<BombcryptoWalletDocument>,
  ) {}

  createWallet(
    address: string,
    blockHeight: number,
    startTimestamp: number,
  ): BombcryptoWallet {
    return {
      address,
      blockHeight,
      startTimestamp,
      endTimestamp: startTimestamp,
      buy: 0,
      sell: 0,
      buyUsd: 0,
      sellUsd: 0,
    };
  }
  async findAllWalletsByBlockHeight(): Promise<BombcryptoWallet[]> {
    return this.bombcryptoWalletModel.find().sort({ blockHeight: -1 }).exec();
  }

  async saveWallets(wallets: BombcryptoWallet[]): Promise<void> {
    validate([wallets], ['Array.<object>']);

    if (wallets.length === 0) {
      return;
    }

    await this.bombcryptoWalletModel.bulkWrite(
      wallets.map((model) => ({
        updateOne: {
          filter: {
            address: model.address,
          },
          update: {
            $set: _.pick(model, [
              'address',
              'balance',
              'blockHeight',
              'startTimestamp',
              'endTimestamp',
              'buy',
              'sell',
              'buyUsd',
              'sellUsd',
            ]),
          },
          upsert: true,
        },
      })),
    );
  }
}
