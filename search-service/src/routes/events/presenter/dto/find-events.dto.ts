import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';

export class FindEventsDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @ApiProperty({ type: String, description: 'Name of the event', required: false })
  name?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @ApiProperty({ type: String, description: 'Date of the event', required: false })
  date?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @ApiProperty({ type: String, description: 'Location of the event', required: false })
  location?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @ApiProperty({ type: String, description: 'Type of the event', required: false })
  type?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @ApiProperty({ type: String, description: 'Status of the event', required: false })
  status?: string;

  @Transform(({ value }) => parseInt(value))
  @ApiProperty({ type: Number, description: 'Page number for pagination', required: false })
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @ApiProperty({ type: Number, description: 'Number of events per page', required: false })
  limit?: number = 10;
}
