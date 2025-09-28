import { ApiProperty } from '@nestjs/swagger';

export class FindTicketResponseDto {
  @ApiProperty({ name: 'eventId', type: String, description: 'Event ID' })
  eventId: string;

  @ApiProperty({ name: 'tickets', type: [String], description: 'List of Ticket IDs' })
  tickets: Array<string>;

  @ApiProperty({ name: 'limit', type: Number, description: 'Limit' })
  limit: number;

  @ApiProperty({ name: 'offset', type: Number, description: 'Offset' })
  offset: number;
}
