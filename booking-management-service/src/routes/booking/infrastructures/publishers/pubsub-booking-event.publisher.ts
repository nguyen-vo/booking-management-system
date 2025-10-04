import { Injectable } from '@nestjs/common';
import { PubSubService } from '../../../../core/pubsub/pubsub.service';
import { BookedEventPublisher } from '../../application/ports/booked-event.publisher';

@Injectable()
export class PubSubBookingEventPublisher extends BookedEventPublisher {
  constructor(private readonly pubSubService: PubSubService) {
    super();
  }

  async publish(userId: string, eventId: string): Promise<void> {
    const topicName = this.topic;
    const data = Buffer.from(JSON.stringify({ userId, eventId }));
    const attributes = {
      eventId,
      eventType: 'reservation-confirmed',
      createdTime: new Date().toISOString(),
      publisher: 'booking-management-service',
    };

    this.logger.log(`Publishing event to topic ${topicName}`);
    await this.pubSubService.publishMessage(topicName, { attributes, orderingKey: attributes.eventId, json: data });
  }
}
