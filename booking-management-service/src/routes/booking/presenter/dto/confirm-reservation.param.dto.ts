import { IsString, IsUUID } from 'class-validator';

export class ConfirmReservationParamDto {
  @IsString()
  @IsUUID()
  reservationId: string;
}
