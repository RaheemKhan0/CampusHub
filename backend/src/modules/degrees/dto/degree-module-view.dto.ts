import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ModuleKinds,
  type ModuleKind,
  Terms,
  type Term,
} from 'src/database/types';

export class DegreeModuleViewDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  moduleId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ModuleKinds as unknown as string[] })
  kind!: ModuleKind;

  @ApiProperty({ enum: Terms as unknown as string[], required: false })
  term?: Term;

  @ApiProperty()
  year!: number;
  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  credits?: number;
}
