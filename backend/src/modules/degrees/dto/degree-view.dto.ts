import { ApiProperty } from '@nestjs/swagger';
import { DegreeTypes, type DegreeType } from 'src/database/types';

export class DegreeViewDto {
  @ApiProperty({ description: 'Degree identifier' })
  id!: string;

  @ApiProperty({ description: 'URL-friendly identifier' })
  slug!: string;

  @ApiProperty({ description: 'Degree name' })
  name!: string;

  @ApiProperty({ description: 'duration of the years' })
  durationYears!: number;

  @ApiProperty({
    description: 'type of degree',
    enum: DegreeTypes as unknown as string[],
  })
  type!: DegreeType;
}
