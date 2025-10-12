import { Module } from '@nestjs/common';
import { BookingQueueGateway } from './booking-queue.gateway';
import { BookingQueueService } from './application/booking-queue.service';
import { EnqueueUserCommandHandler } from './application/commands/enqueue-user/enqueue-user.handler';
import { BookingQueueInfrastructureModule } from './infrastructures/booking-queue.infrastructure.module';
import { DequeueUserEventHandler } from './application/events/dequeue-user-event.handler';
import { PubSubSubscriptionModule } from 'src/core/modules/pubsub-subscription/pubsub.module';
import { SubscriptionName } from './constants';

@Module({
  imports: [BookingQueueInfrastructureModule, PubSubSubscriptionModule.register(SubscriptionName)],
  providers: [BookingQueueGateway, BookingQueueService, EnqueueUserCommandHandler, DequeueUserEventHandler],
})
export class BookingQueueModule {}
