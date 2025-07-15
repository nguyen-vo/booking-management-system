import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindAllEventRepository } from 'src/routes/events/application/ports/find-all-events.repository';
import { FindAllEventsQuery } from 'src/routes/events/application/queries/find-all-events/find-all-events.query';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Event } from '../../../domain/event';

@Injectable()
export class OrmFindAllEventRepository implements FindAllEventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll(query: FindAllEventsQuery): Promise<{ events: Event[]; total: number }> {
    const { limit = 10, page = 1, date, location, name, status, type } = query;
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.location', 'location')
      .leftJoinAndSelect('event.performers', 'performers');
    this._applyNameFilter(queryBuilder, name)
      ._applyDateFilter(queryBuilder, date)
      ._applyLocationFilter(queryBuilder, location)
      ._applyTypeFilter(queryBuilder, type)
      ._applyStatusFilter(queryBuilder, status)
      ._applyPagination(queryBuilder, page, limit)
      ._applyAvailableTicketsFilter(queryBuilder);

    queryBuilder.orderBy('event.date', 'ASC');
    const { entities, raw } = await queryBuilder.getRawAndEntities<Event>();
    const event = entities.map((e, index) => {
      const rawData = raw[index];
      return {
        ...e,
        ticketsAvailable: rawData?.ticketsAvailable || 0,
      };
    });
    const total = await queryBuilder.getCount();
    return {
      events: event,
      total,
    };
  }

  private _applyNameFilter(queryBuilder: SelectQueryBuilder<Event>, name?: string) {
    if (name) {
      queryBuilder.andWhere('LOWER(event.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }
    return this;
  }

  private _applyDateFilter(queryBuilder: SelectQueryBuilder<Event>, date?: string) {
    if (date) {
      const searchDate = new Date(date);
      queryBuilder.andWhere('DATE(event.date) = DATE(:date)', {
        date: searchDate.toISOString().split('T')[0],
      });
    }
    return this;
  }

  private _applyLocationFilter(queryBuilder: SelectQueryBuilder<Event>, location?: string) {
    if (location) {
      queryBuilder.andWhere(
        '(LOWER(location.name) LIKE LOWER(:location) OR LOWER(location.address) LIKE LOWER(:location))',
        { location: `%${location}%` },
      );
    }
    return this;
  }

  private _applyTypeFilter(queryBuilder: SelectQueryBuilder<Event>, type?: string) {
    if (type) {
      queryBuilder.andWhere('event.type = :type', { type });
    }
    return this;
  }

  private _applyStatusFilter(queryBuilder: SelectQueryBuilder<Event>, status?: string) {
    if (status) {
      queryBuilder.andWhere('event.status = :status', { status });
    }
    return this;
  }

  private _applyPagination(queryBuilder: SelectQueryBuilder<Event>, page: number, limit: number) {
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).limit(limit);
    return this;
  }

  private _applyAvailableTicketsFilter(queryBuilder: SelectQueryBuilder<Event>) {
    queryBuilder.addSelect((qb) => {
      return qb
        .select('COUNT(tickets.ticketId)', 'ticketsAvailable')
        .from('tickets', 'tickets')
        .where('tickets.eventId = event.eventId')
        .andWhere('tickets.status = :status', { status: 'Available' });
    }, 'ticketsAvailable');
    return this;
  }
}
