import { ApiProperty } from '@nestjs/swagger';
class LocationDto {
  @ApiProperty({ type: String, format: 'uuid', description: 'Unique identifier for the location', required: true })
  locationId: string;

  @ApiProperty({ type: String, description: 'Name of the location', required: true })
  name: string;
}

class PerformerDto {
  @ApiProperty({ type: String, format: 'uuid', description: 'Unique identifier for the performer', required: true })
  performerId: string;

  @ApiProperty({ type: String, description: 'Name of the performer', required: true })
  name: string;
}
export class EventResponseDto {
  @ApiProperty({ type: String, format: 'uuid', description: 'Unique identifier for the event', required: true })
  eventId: string;

  @ApiProperty({ type: String, description: 'Name of the event', required: true })
  name: string;

  @ApiProperty({ type: Date, description: 'Date and time of the event', required: true })
  date: Date;

  @ApiProperty({ type: String, description: 'Type of the event', required: true })
  type: string;

  @ApiProperty({ type: String, description: 'Status of the event', required: true })
  status: string;

  @ApiProperty({ type: String, description: 'Description of the event', required: false })
  description?: string;

  @ApiProperty({ type: Number, description: 'Number of tickets available for the event', required: true })
  ticketsAvailable: number;

  @ApiProperty({ type: LocationDto, description: 'Location of the event', required: true })
  location: LocationDto;

  @ApiProperty({ type: [PerformerDto], description: 'List of performers associated with the event', required: true })
  performers: PerformerDto[];
}

export class PaginatedEventResponseDto {
  @ApiProperty({ type: [EventResponseDto], description: 'List of events', required: true })
  events: EventResponseDto[];

  @ApiProperty({ type: Number, description: 'Total number of events', required: true })
  total: number;

  @ApiProperty({ type: Number, description: 'Current page number', required: true })
  page: number;

  @ApiProperty({ type: Number, description: 'Number of events per page', required: true })
  limit: number;

  @ApiProperty({ type: Number, description: 'Total number of pages', required: true })
  totalPages: number;
}
