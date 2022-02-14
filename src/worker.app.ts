import { EkConfigService } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EkpModule } from './ekp/ekp.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({ useClass: EkConfigService }),
    JobsModule,
    EkpModule,
  ],
})
export class WorkerApp {}
