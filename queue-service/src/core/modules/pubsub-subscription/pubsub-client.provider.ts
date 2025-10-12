import { Injectable } from '@nestjs/common';
import { PubSub } from '@google-cloud/pubsub';

@Injectable()
export class PubSubClientProvider {
  private _client: PubSub;

  constructor() {
    this._client = new PubSub({ projectId: process.env.PROJECT_ID });
  }
  get client(): PubSub {
    return this._client;
  }
}
