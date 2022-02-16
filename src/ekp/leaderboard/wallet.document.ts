import { DocumentDto } from '@earnkeeper/ekp-sdk';

export class WalletDocument extends DocumentDto {
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
