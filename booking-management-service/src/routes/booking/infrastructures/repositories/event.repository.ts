import { InjectRepository } from '@nestjs/typeorm';
import { EventRepository } from '../../application/ports/event.repository';
import { Event } from '../entities/event.entity';
import { Repository } from 'typeorm';

export class OrmEventRepository extends EventRepository {
  constructor(@InjectRepository(Event) private readonly eventRepository: Repository<Event>) {
    super();
  }

  async getEventIdByTicketId(ticketId: string): Promise<Event | null> {
    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select(['event.eventId', 'event.isPopular'])
      .innerJoin('event.tickets', 'ticket')
      .where('ticket.ticketId = :ticketId', { ticketId })
      .getOne();

    return result;
  }
}
