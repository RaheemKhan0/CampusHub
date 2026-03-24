import { ApiProperty } from '@nestjs/swagger';
import { ChannelViewDto } from './channel-view.dto';

export class ChannelListResponseDto {
  @ApiProperty({
    type: [ChannelViewDto],
    description: 'the public channels for the server',
    isArray: true,
  })
  publicChannels!: ChannelViewDto[];

  @ApiProperty({
    type: [ChannelViewDto],
    description: 'private channels the user has joined',
  })
  privateChannels?: ChannelViewDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}
