import { PubSub } from '@google-cloud/pubsub/build/src/pubsub';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PubSubFactory {
  static create(): PubSub {
    return new PubSub({ projectId: process.env.PROJECT_ID });
  }
}
