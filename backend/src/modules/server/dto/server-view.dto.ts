import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { type ServerType, ServerTypes } from 'src/database/types';

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
    description: 'BetterAuth user id when the server has an owner',
  })
  ownerId?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
