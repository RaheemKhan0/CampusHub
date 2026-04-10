import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type ServerType, ServerTypes, type SocietyCategory, SocietyCategoryTypes } from 'src/database/types';

export class ServerViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ServerTypes, enumName: 'ServerType' })
  type!: ServerType;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  degreeId!: string;

  @ApiProperty()
  degreeModuleId!: string;

  @ApiPropertyOptional({
    description: 'Academic year of the degree module (1-based)',
  })
  moduleYear?: number;

  @ApiPropertyOptional({
    description: 'BetterAuth user id when the server has an owner',
  })
  ownerId?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional({
    enum: SocietyCategoryTypes,
    enumName: 'SocietyCategory',
    description: 'Category label — used to group citysocieties servers',
  })
  category?: SocietyCategory;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
