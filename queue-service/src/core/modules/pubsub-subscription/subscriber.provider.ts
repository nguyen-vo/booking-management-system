import { Injectable } from '@nestjs/common';
import { PubSubClientProvider } from './pubsub-client.provider';
import { Subscription } from '@google-cloud/pubsub';

@Injectable()
export class SubscriberProvider {
  private _subscription: Subscription;
  constructor(
    private readonly pubsub: PubSubClientProvider,
    private readonly subscriptionName: string,
  ) {
    this._subscription = this.pubsub.client.subscription(this.subscriptionName);
  }

  get subscription(): Subscription {
    return this._subscription;
  }
}
