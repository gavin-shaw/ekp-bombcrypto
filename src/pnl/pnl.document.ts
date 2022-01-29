import { EkDocument } from '@earnkeeper/ekp-sdk-nestjs';

export class PnlDocument extends EkDocument {
  constructor(properties: PnlDocument) {
    super(properties);
  }

  action: string;
  actionTooltip: string;
  bcoinBnbValue: number;
  bcoinValue: number;
  block: number;
  costBasisFiat: number;
  ownerAddress: string;
  ownerChain: string;
  gasBnbValue: number;
  gasFiatValue: number;
  fiatSymbol: string;
  pnlBnbValue: number;
  pnlFiatValue: number;
  realizedValueFiat: number;
  timestamp: number;
  txlink: string;
  updated: number;
}