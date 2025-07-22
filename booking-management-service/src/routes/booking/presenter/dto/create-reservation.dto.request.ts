import { IsString, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsString({ each: true })
  ticketIds: string[];

  @IsString()
  @IsUUID()
  userId: string;
}
