import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDtoResponse {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the created reservation',
    required: true,
  })
  reservationId: string;

  @ApiProperty({
    type: [String],
    description: 'List of ticket IDs associated with the reservation',
    required: true,
  })
  ticketIds: string[];

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the user who made the reservation',
    required: true,
  })
  userId: string;
}
