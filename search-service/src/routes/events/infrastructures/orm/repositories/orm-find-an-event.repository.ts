import { FindAnEventRepository } from 'src/routes/events/application/ports/find-an-event.repository';
import { Event } from 'src/routes/events/domain/event';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrmFindAnEventRepository implements FindAnEventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findById(eventId: string): Promise<Event | null> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.location', 'location')
      .leftJoinAndSelect('event.performers', 'performers')
      .where('event.eventId = :eventId', { eventId });

    queryBuilder.addSelect((qb) => {
      return qb
        .select('COUNT(tickets.ticketId)', 'ticketsAvailable')
        .from('tickets', 'tickets')
        .where('tickets.eventId = event.eventId')
        .andWhere('tickets.status = :status', { status: 'Available' });
    }, 'ticketsAvailable');

    const result = await queryBuilder.getRawAndEntities<Event>();
    if (result.entities.length === 0) {
      return null;
    }

    const event = result.entities[0];
    const rawData = result.raw[0];
    return {
      ...event,
      ticketsAvailable: parseInt(String(rawData.ticketsAvailable) || '0'),
    };
  }
}
