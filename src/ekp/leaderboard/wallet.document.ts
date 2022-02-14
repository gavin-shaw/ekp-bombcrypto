import { EkDocument } from '@earnkeeper/ekp-sdk-nestjs';

export class WalletDocument extends EkDocument {
  constructor(properties: WalletDocument) {
    super(properties);
  }

  readonly address: string;
  readonly balance?: number;
  readonly buy: number;
  readonly buyUsd: number;
  readonly fiatSymbol: string;
  readonly net: number;
  readonly sell: number;
  readonly sellUsd: number;
  readonly startTimestamp: number;
  readonly updated: number;
}
