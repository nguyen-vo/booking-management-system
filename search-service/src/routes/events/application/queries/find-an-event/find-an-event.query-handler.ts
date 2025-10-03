import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindAnEventQuery } from './find-an-event.query';
import { EventResponseDto } from 'src/routes/events/presenter/dto/event-response.dto';
import { FindAnEventRepository } from '../../ports/find-an-event.repository';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(FindAnEventQuery)
export class FindAnEventQueryHandler implements IQueryHandler<FindAnEventQuery, EventResponseDto> {
  constructor(private readonly findAnEventRepository: FindAnEventRepository) {}

  async execute(query: FindAnEventQuery): Promise<EventResponseDto> {
    const event = await this.findAnEventRepository.findById(query.eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${query.eventId} not found`);
    }

    return {
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
    };
  }
}
