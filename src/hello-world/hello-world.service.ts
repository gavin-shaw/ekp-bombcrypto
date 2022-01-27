import {
  ClientService,
  ClientStateChangedEvent,
  collection,
  EkDocument,
  filterPath,
  LayerDto,
} from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import moment from 'moment';
import { filter } from 'rxjs';
import { HelloWorldDocument } from './hello-world.document';

const FILTER_PATH = '/plugin/bombcrypto/hello-world';
const COLLECTION_NAME = collection(HelloWorldDocument);

@Injectable()
export class HelloWorldProcessor {
  constructor(private clientService: ClientService) {
    this.clientService.clientStateEvents$
      .pipe(filter((event) => filterPath(event, FILTER_PATH)))
      .subscribe((event) => {
        this.handleClientStateEvent(event);
      });
  }

  async handleClientStateEvent(
    clientStateChangedEvent: ClientStateChangedEvent,
  ) {
    const documents = [
      {
        id: 'hello-world-1',
        name: 'Hello',
        value: 'World',
      },
    ];

    await this.emitDocuments(
      clientStateChangedEvent,
      COLLECTION_NAME,
      documents,
    );
  }

  async emitDocuments(
    clientEvent: ClientStateChangedEvent,
    collectionName: string,
    documents: EkDocument[],
  ) {
    const addLayers: LayerDto[] = [
      {
        id: randomUUID(),
        collectionName,
        set: documents,
        tags: [collectionName],
        timestamp: moment().unix(),
      },
    ];
    await this.clientService.addLayers(clientEvent.clientId, addLayers);
  }
}
