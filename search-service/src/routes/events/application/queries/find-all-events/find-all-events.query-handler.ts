import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedEventResponseDto } from 'src/routes/events/presenter/dto/event-response.dto';
import { FindAllEventRepository } from '../../ports/find-all-events.repository';
import { FindAllEventsQuery } from './find-all-events.query';

@QueryHandler(FindAllEventsQuery)
export class FindAllEventQueryHandler implements IQueryHandler<FindAllEventsQuery, PaginatedEventResponseDto> {
  constructor(private readonly findAllEventRepository: FindAllEventRepository) {}

  async execute(query: FindAllEventsQuery): Promise<PaginatedEventResponseDto> {
    const { limit, page, date, location, name, status, type } = query;
    console.log('Executing FindAllEventsQuery with parameters:');
    const res = await this.findAllEventRepository.findAll({
      name,
      date,
      location,
      type,
      status,
      page,
      limit,
    });
    console.dir(res, { depth: null });
    return {
      events: res.events.map((event) => ({
        eventId: event.eventId,
        name: event.name,
        date: event.date,
        type: event.type,
        status: event.status,
        description: event.description,
        ticketsAvailable: event.ticketsAvailable,
        location: {
          locationId: event.location.locationId,
          name: event.location.name,
        },
        performers: event.performers.map((performer) => ({
          performerId: performer.performerId,
          name: performer.name,
        })),
      })),
      total: res.total,
      page,
      limit,
      totalPages: Math.ceil(res.total / limit),
    };
  }
}
