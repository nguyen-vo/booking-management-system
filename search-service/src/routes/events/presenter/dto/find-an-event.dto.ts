import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class FindAnEventDto {
  @IsString()
  @IsUUID()
  @ApiProperty({ type: String, format: 'uuid', description: 'Unique identifier for the event', required: true })
  id: string;
}
