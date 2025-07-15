import { IsString, IsUUID } from 'class-validator';

export class FindAnEventDto {
  @IsString()
  @IsUUID()
  id: string;
}
