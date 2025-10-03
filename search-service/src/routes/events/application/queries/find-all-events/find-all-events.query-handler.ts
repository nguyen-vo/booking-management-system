import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedEventResponseDto } from 'src/routes/events/presenter/dto/event-response.dto';
import { FindAllEventsQuery } from './find-all-events.query';
import { FindAllEventRepositoryFactory } from 'src/routes/events/infrastructures/factories/find-all-event-repository.factory';

@QueryHandler(FindAllEventsQuery)
export class FindAllEventQueryHandler implements IQueryHandler<FindAllEventsQuery, PaginatedEventResponseDto> {
  constructor(private readonly repositoryFactory: FindAllEventRepositoryFactory) {}

  async execute(query: FindAllEventsQuery): Promise<PaginatedEventResponseDto> {
    const { limit, page, date, location, name, status, type } = query;
    const findAllEventRepository = this.repositoryFactory.getRepository(query.useElasticsearch);
    const res = await findAllEventRepository.findAll({
      name,
      date,
      location,
      type,
      status,
      page,
      limit,
      useElasticsearch: query.useElasticsearch,
    });
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
          address: event.location.address,
          seatCapacity: event.location.seatCapacity,
        },
        performers: event.performers.map((performer) => ({
          performerId: performer.performerId,
          name: performer.name,
          description: performer.description,
        })),
      })),
      total: res.total,
      page,
      limit,
      totalPages: Math.ceil(res.total / limit),
    };
  }
}
