import { ServerViewDto } from './server-view.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ServerListResponseDto {
  @ApiProperty({
    type: ServerViewDto,
    description: 'list of servers',
    isArray: true,
  })
  items: ServerViewDto[];
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page?: number;

  @ApiProperty({ example: 20 })
  pageSize?: number;
}
