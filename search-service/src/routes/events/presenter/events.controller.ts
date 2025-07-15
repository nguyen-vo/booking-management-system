import { Controller, Get, Query, Param, ValidationPipe, UsePipes } from '@nestjs/common';
import { EventsService } from '../application/events.service';
import { FindEventsDto } from './dto/find-events.dto';
import { EventResponseDto, PaginatedEventResponseDto } from './dto/event-response.dto';
import { FindAnEventDto } from './dto/find-an-event.dto';

@Controller('events')
@UsePipes(new ValidationPipe({ transform: true }))
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('search')
  async searchEvents(@Query() searchDto: FindEventsDto): Promise<PaginatedEventResponseDto> {
    return this.eventsService.searchEvents(searchDto);
  }

  @Get(':id')
  async getEventById(@Param() params: FindAnEventDto): Promise<EventResponseDto> {
    return this.eventsService.findEventById(params.id);
  }
}
