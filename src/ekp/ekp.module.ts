import { SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { JobsModule } from '../jobs/jobs.module';
import { IntroService } from './intro/intro.service';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { MyPnlService } from './my-pnl/my-pnl.service';
import { UiService } from './ui/ui.service';

@Module({
  imports: [DbModule, JobsModule, SdkModule],
  providers: [LeaderboardService, IntroService, MyPnlService, UiService],
})
export class EkpModule {}
