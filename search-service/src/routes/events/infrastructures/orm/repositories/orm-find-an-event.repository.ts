import { FindAnEventRepository } from 'src/routes/events/application/ports/find-an-event.repository';
import { Event } from 'src/routes/events/domain/event';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class OrmFindAnEventRepository implements FindAnEventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @Inject(CACHE_MANAGER) private cacheStore: Cache,
  ) {}

  async findById(eventId: string): Promise<Event | null> {
    let event = await this.cacheStore.get<Event>(`event:${eventId}`);
    if (event) {
      return event;
    }
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

    event = result.entities[0];
    const rawData = result.raw[0];
    await this.cacheStore.set(`event:${eventId}`, event, 5 * 60 * 1000);
    return {
      ...event,
      ticketsAvailable: parseInt(String(rawData.ticketsAvailable) || '0'),
    };
  }
}
