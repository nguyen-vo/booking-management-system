import { Event } from '../../domain/event';
import { FindAllEventsQuery } from '../queries/find-all-events/find-all-events.query';

export abstract class FindAllEventRepository {
  abstract findAll(query: FindAllEventsQuery): Promise<{ events: Event[]; total: number }>;
}
