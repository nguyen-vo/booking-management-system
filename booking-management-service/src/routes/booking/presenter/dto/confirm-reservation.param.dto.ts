import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ConfirmReservationParamDto {
  @IsString()
  @IsUUID()
  @ApiProperty({ type: String, format: 'uuid', description: 'The ID of the reservation to confirm', required: true })
  reservationId: string;
}
