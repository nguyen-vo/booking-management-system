import { Event } from '../../domain/event';

export abstract class EventRepository {
  abstract getEventIdByTicketId(ticketId: string): Promise<Event | null>;
}
