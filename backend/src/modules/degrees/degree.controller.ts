import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { DegreeService } from './degree.service';
import { DegreeViewDto } from './dto/degree-view.dto';
import { DegreeDetailDto } from './dto/degree-detail.dto';
import { DegreeModuleViewDto } from './dto/degree-module-view.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('degrees')
@Controller('degrees')
export class DegreeController {
  constructor(private readonly degrees: DegreeService) {}

  @Get()
  @ApiOperation({ summary: 'List all degrees' })
  @ApiOkResponse({ type: DegreeViewDto, isArray: true })
  @AllowAnonymous()
  async listDegrees(): Promise<DegreeViewDto[]> {
    return this.degrees.listDegrees();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Retrieve degree details by slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiOkResponse({ type: DegreeDetailDto })
  async getDegree(@Param('slug') slug: string): Promise<DegreeDetailDto> {
    return this.degrees.getDegreeBySlug(slug);
  }

  @Get(':slug/modules')
  @ApiOperation({ summary: 'List modules for a degree' })
  @ApiParam({ name: 'slug', type: String })
  @ApiOkResponse({ type: DegreeModuleViewDto, isArray: true })
  async listModules(
    @Param('slug') slug: string,
  ): Promise<DegreeModuleViewDto[]> {
    return this.degrees.listDegreeModules(slug);
  }
}
