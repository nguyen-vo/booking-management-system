import { Logger } from '@nestjs/common';

export abstract class BookedEventPublisher {
  protected readonly logger = new Logger(BookedEventPublisher.name);
  protected readonly topic = 'reservation-confirmed';

  abstract publish(userId: string, eventId: string, eventType: string): Promise<void>;
}
