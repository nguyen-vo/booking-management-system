import { Message } from '../../domain/message.interface';

export class TicketBookedEvent implements Message {
  public readonly topic: string;
  public readonly data: Record<string, unknown>;
  public readonly attributes?: Record<string, string> | undefined;

  constructor(
    public readonly userId: string,
    public readonly eventId: string,
  ) {
    this.attributes = { eventId: crypto.randomUUID(), createdOn: new Date().toISOString() };
    this.topic = 'ticket-booked';
    this.data = {
      userId: this.userId,
      eventId: this.eventId,
    };
  }
}
