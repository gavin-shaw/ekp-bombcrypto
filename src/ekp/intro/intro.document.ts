import { DocumentDto } from '@earnkeeper/ekp-sdk';

export class IntroDocument extends DocumentDto {
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
