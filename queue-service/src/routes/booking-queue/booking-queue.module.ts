import { Module } from '@nestjs/common';
import { BookingQueueGateway } from './booking-queue.gateway';
import { BookingQueueService } from './application/booking-queue.service';
import { EnqueueUserCommandHandler } from './application/commands/enqueue-user/enqueue-user.command.handler';
import { BookingQueueInfrastructureModule } from './infrastructures/booking-queue.infrastructure.module';
import { DequeueUserCommandHandler } from './application/commands/dequeue-user/dequeue-user.command.handler';
import { PubSubSubscriptionModule } from 'src/core/modules/pubsub-subscription/pubsub.module';
import { SubscriptionName } from './constants';

@Module({
  imports: [BookingQueueInfrastructureModule, PubSubSubscriptionModule.register(SubscriptionName)],
  providers: [BookingQueueGateway, BookingQueueService, EnqueueUserCommandHandler, DequeueUserCommandHandler],
})
export class BookingQueueModule {}
