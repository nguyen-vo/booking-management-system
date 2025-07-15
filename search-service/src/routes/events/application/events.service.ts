import { Injectable } from '@nestjs/common';
import { FindEventsDto } from '../presenter/dto/find-events.dto';
import { EventResponseDto, PaginatedEventResponseDto } from '../presenter/dto/event-response.dto';
import { QueryBus } from '@nestjs/cqrs';
import { FindAllEventsQuery } from './queries/find-all-events/find-all-events.query';
import { FindAnEventQuery } from './queries/find-an-event/find-an-event.query';

@Injectable()
export class EventsService {
  constructor(private readonly queryBus: QueryBus) {}

  async searchEvents(searchDto: FindEventsDto): Promise<PaginatedEventResponseDto> {
    return this.queryBus.execute(
      new FindAllEventsQuery(
        searchDto.name,
        searchDto.date,
        searchDto.location,
        searchDto.type,
        searchDto.status,
        searchDto.page,
        searchDto.limit,
      ),
    );
  }

  async findEventById(eventId: string): Promise<EventResponseDto> {
    return this.queryBus.execute(new FindAnEventQuery(eventId));
  }
}
