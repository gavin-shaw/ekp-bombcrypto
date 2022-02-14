import { EkDocument } from '@earnkeeper/ekp-sdk-nestjs';

export class IntroDocument extends EkDocument {
  constructor(properties: IntroDocument) {
    super(properties);
  }

  readonly biggestLoserAmount: number;
  readonly biggestWinnerAmount: number;
  readonly bcoinPrice: number;
  readonly earnAmount: number;
  readonly earnEvery: string;
  readonly earnPerDay: number;
  readonly fiatSymbol: string;
  readonly gameUpTime: string;
  readonly heroNftPrice: number;
  readonly numPlayers: number;
  readonly sendYourHeroEvery: string;
}
