import { SdkModule } from '@earnkeeper/ekp-sdk-nestjs';
import { Module } from '@nestjs/common';
import { HelloWorldProcessor } from './hello-world/hello-world.service';
import { UiProcessor } from './ui/ui.processor';

@Module({
  imports: [SdkModule],
  providers: [HelloWorldProcessor, UiProcessor],
})
export class WorkerApp {}
