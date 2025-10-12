import { IsString, IsUUID } from 'class-validator';

export class JoinQueueDto {
  @IsUUID()
  @IsString()
  userId: string;

  @IsUUID()
  @IsString()
  eventId: string;
}
