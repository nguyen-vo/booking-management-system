import { DynamicModule, Module } from '@nestjs/common';
import { PubSubClientProvider } from './pubsub-client.provider';
import { SubscriberProvider } from './subscriber.provider';
import { getSubscriptionNameToken } from './subscription-name.token';

@Module({})
export class PubSubSubscriptionModule {
  static register(subscriptionName: string): DynamicModule {
    return {
      module: PubSubSubscriptionModule,
      providers: [
        PubSubClientProvider,
        {
          inject: [PubSubClientProvider],
          useFactory: (pubsub: PubSubClientProvider) => new SubscriberProvider(pubsub, subscriptionName),
          provide: getSubscriptionNameToken(subscriptionName),
        },
      ],
      exports: [getSubscriptionNameToken(subscriptionName)],
    };
  }
}
