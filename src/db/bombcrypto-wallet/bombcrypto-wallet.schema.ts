import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BombcryptoWalletDocument = BombcryptoWallet & Document;

@Schema()
export class BombcryptoWallet {
  @Prop()
  readonly address: string;
  @Prop()
  readonly balance?: number;
  @Prop({ index: true })
  readonly blockHeight: number;
  @Prop()
  readonly startTimestamp: number;
  @Prop()
  readonly endTimestamp: number;
  @Prop()
  buy: number;
  @Prop()
  sell: number;
  @Prop()
  buyUsd: number;
  @Prop()
  sellUsd: number;
}

export const BombcryptoWalletSchema =
  SchemaFactory.createForClass(BombcryptoWallet);
