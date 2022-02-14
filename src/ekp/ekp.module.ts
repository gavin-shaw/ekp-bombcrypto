import { SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { IntroService } from './intro/intro.service';
import { PnlService } from './pnl/pnl.service';
import { UiService } from './ui/ui.service';

@Module({
  imports: [DbModule, SdkModule],
  providers: [LeaderboardService, IntroService, PnlService, UiService],
})
export class EkpModule {}
