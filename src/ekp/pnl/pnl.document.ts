import { EkDocument } from '@earnkeeper/ekp-sdk-nestjs';

export class PnlDocument extends EkDocument {
  constructor(properties: PnlDocument) {
    super(properties);
  }

  readonly action: string;
  readonly actionTooltip: string;
  readonly bcoinValue: number;
  readonly block: number;
  readonly costBasisFiat: number;
  readonly ownerAddress: string;
  readonly ownerChain: string;
  readonly gasBnbValue: number;
  readonly gasFiatValue: number;
  readonly fiatSymbol: string;
  readonly pnlFiatValue: number;
  readonly realizedValueFiat: number;
  readonly timestamp: number;
  readonly txlink: string;
  readonly updated: number;
}