import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindTicketsQuery, FoundTickets } from './find-tickets.query';
import { FindTicketsRepository } from '../../ports/find-tickets.repository';

@QueryHandler(FindTicketsQuery)
export class FindTicketsQueryHandler implements IQueryHandler<FindTicketsQuery, FoundTickets> {
  constructor(private readonly findTicketsRepository: FindTicketsRepository) {}

  async execute(query: FindTicketsQuery): Promise<FoundTickets> {
    const tickets = await this.findTicketsRepository.findTickets(query.eventId, query.limit, query.offset);
    return {
      eventId: query.eventId,
      tickets,
      limit: query.limit,
      offset: query.offset,
    };
  }
}
