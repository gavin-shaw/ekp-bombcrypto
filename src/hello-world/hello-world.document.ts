import { EkDocument } from '@earnkeeper/ekp-sdk-nestjs';

export class HelloWorldDocument extends EkDocument {
  constructor(properties: HelloWorldDocument) {
    super(properties);
  }

  readonly name: string;
  readonly value: string;
}
