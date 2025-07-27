import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsString({ each: true })
  @ApiProperty({ type: [String], description: 'List of ticket IDs to reserve', required: true })
  ticketIds: string[];

  @IsString()
  @IsUUID()
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the user making the reservation',
    required: true,
  })
  userId: string;
}
