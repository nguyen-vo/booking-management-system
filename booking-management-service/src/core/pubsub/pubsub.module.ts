import { Module } from '@nestjs/common';
import { PubSubFactory } from './pubsub.provider';
import { PubSub } from '@google-cloud/pubsub';
import { PubSubService } from './pubsub.service';

@Module({
  providers: [
    {
      provide: PubSub,
      useFactory: () => {
        return PubSubFactory.create();
      },
    },
    PubSubService,
  ],
  exports: [PubSub, PubSubService],
})
export class PubSubModule {}
