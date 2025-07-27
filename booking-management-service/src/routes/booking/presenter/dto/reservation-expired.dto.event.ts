import { ApiProperty } from '@nestjs/swagger';

export class ReservationExpiredEventDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the reservation that has expired',
    required: true,
  })
  reservationId: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the user who made the reservation',
    required: true,
  })
  userId: string;

  @ApiProperty({ type: [String], description: 'List of ticket IDs associated with the reservation', required: true })
  ticketIds: string[];
}
