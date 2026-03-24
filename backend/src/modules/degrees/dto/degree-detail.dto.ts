import { ApiProperty } from '@nestjs/swagger';
import { DegreeModuleViewDto } from './degree-module-view.dto';
import { DegreeViewDto } from './degree-view.dto';

export class DegreeDetailDto extends DegreeViewDto {
  @ApiProperty({ type: () => [DegreeModuleViewDto] })
  modules!: DegreeModuleViewDto[];
}
