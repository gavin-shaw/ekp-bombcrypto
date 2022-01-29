import { SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { PnlProcessor } from './pnl/pnl.service';
import { UiProcessor } from './ui/ui.processor';

@Module({
  imports: [SdkModule],
  providers: [PnlProcessor, UiProcessor],
})
export class WorkerApp {}
