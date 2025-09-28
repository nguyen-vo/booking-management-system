import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class FindAnEventDto {
  @IsString()
  @IsUUID()
  @ApiProperty({ type: String, format: 'uuid', description: 'Unique identifier for the event', required: true })
  id: string;
}

export class EventTicketQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty({ type: Number, required: false, description: 'Number of records to return' })
  limit?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ type: Number, required: false, description: 'Number of records to skip' })
  offset: number;
}
