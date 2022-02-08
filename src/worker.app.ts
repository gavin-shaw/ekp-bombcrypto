import { SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { IntroService } from './intro/intro.service';
import { PnlService } from './pnl/pnl.service';
import { UiService } from './ui/ui.service';

@Module({
  imports: [SdkModule],
  providers: [IntroService, PnlService, UiService],
})
export class WorkerApp {}
