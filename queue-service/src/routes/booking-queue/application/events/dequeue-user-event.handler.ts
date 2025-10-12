import { EventsHandler } from '@nestjs/cqrs';
import { QueueRepository } from '../ports/queue.repository';
import { DequeueUserEvent } from './dequeue-user.event';
import { Logger } from '@nestjs/common';

@EventsHandler(DequeueUserEvent)
export class DequeueUserEventHandler {
  constructor(private readonly queue: QueueRepository) {}

  async handle(event: DequeueUserEvent) {
    const { eventId } = event;
    Logger.log(`Handling DequeueUserEvent for event: ${eventId}`);
    const nextUser = await this.queue.dequeueUser(eventId);
    if (nextUser) {
      Logger.log(`Next user dequeued: ${nextUser} for event ${eventId}`, 'DequeueUserEventHandler');
    } else {
      Logger.log(`No user in queue for event ${eventId}`, 'DequeueUserEventHandler');
    }
  }
}
