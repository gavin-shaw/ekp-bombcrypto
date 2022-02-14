import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { DbModule } from '../db';
import { PNL_QUEUE } from './queues';
import { UpdateWalletsProcessor } from './update-wallets/update-wallets.processor';
@Module({
  imports: [BullModule.registerQueue({ name: PNL_QUEUE }), DbModule],
  providers: [UpdateWalletsProcessor],
})
export class JobsModule {}
