import { Controller, Get, Query, Param, ValidationPipe, UsePipes, Headers } from '@nestjs/common';
import { EventsService } from '../application/events.service';
import { FindEventsDto } from './dto/find-events.dto';
import { EventResponseDto, PaginatedEventResponseDto } from './dto/event-response.dto';
import { EventTicketQuery, FindAnEventDto } from './dto/find-an-event.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindTicketResponseDto } from './dto/find-ticket-response.dto';

@ApiTags('events')
@Controller('events')
@UsePipes(new ValidationPipe({ transform: true }))
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('')
  @ApiResponse({ status: 200, description: 'Search events successfully', type: PaginatedEventResponseDto })
  async searchEvents(
    @Query() searchDto: FindEventsDto,
    @Headers('x-use-elasticsearch') useElasticsearch: boolean,
  ): Promise<PaginatedEventResponseDto> {
    useElasticsearch = Boolean(useElasticsearch);
    return this.eventsService.searchEvents(searchDto, useElasticsearch);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Event found successfully', type: EventResponseDto })
  async getEventById(@Param() params: FindAnEventDto): Promise<EventResponseDto> {
    return this.eventsService.findEventById(params.id);
  }

  @Get(':id/tickets')
  @ApiResponse({ status: 200, description: 'Event found successfully', type: EventResponseDto })
  async findTickets(@Param() params: FindAnEventDto, @Query() query: EventTicketQuery): Promise<FindTicketResponseDto> {
    return this.eventsService.findEventTickets(params.id, query);
  }
}
