import { Event } from '../../domain/event';

export abstract class FindAnEventRepository {
  abstract findById(eventId: string): Promise<Event | null>;
}
