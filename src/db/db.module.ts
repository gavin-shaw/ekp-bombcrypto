import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BombcryptoWallet,
  BombcryptoWalletRepository,
  BombcryptoWalletSchema,
} from './bombcrypto-wallet';
import { TransactionLogRepository } from './transaction-log';

const schemas = [
  { name: BombcryptoWallet.name, schema: BombcryptoWalletSchema },
];

@Module({
  imports: [MongooseModule.forFeature(schemas)],
  providers: [BombcryptoWalletRepository, TransactionLogRepository],
  exports: [BombcryptoWalletRepository, TransactionLogRepository],
})
export class DbModule {}
