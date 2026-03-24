import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Max,
  Min,
  IsInt,
  IsIn,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServerTypes } from 'src/database/types';

export class ListServersQueryDto {
  @ApiPropertyOptional({ description: 'free Text search' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Degree slug' })
  @IsOptional()
  @IsString()
  degreeSlug?: string;

  @ApiPropertyOptional({ description: 'Degree identifier' })
  @IsOptional()
  @IsMongoId()
  degreeId?: string;

  @ApiPropertyOptional({ description: 'Student start year (calendar year)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  startYear?: number;

  @ApiPropertyOptional({
    description: 'Boolean value to indicate if the query is paginated or not',
  })
  @IsBoolean()
  @IsOptional()
  paginated?: boolean;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({
    description: 'Select Type ',
    enum: ServerTypes,
    enumName: 'ServerType',
  })
  @IsOptional()
  @IsIn(ServerTypes as unknown as string[])
  type?: (typeof ServerTypes)[number];
}
