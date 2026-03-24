// src/modules/channels/dto/channel-view.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ChannelTypes } from 'src/database/types';

const PRIVACY = ['public', 'hidden'] as const;

export class ChannelViewDto {
  @ApiProperty({
    description: 'Channel id',
    example: '6710a4f2f23a5a2c5f6f8a1b',
  })
  id!: string;

  @ApiProperty({
    description: 'Server id this channel belongs to',
    example: '670ffe9bd4e2f1d3c9a4b123',
  })
  serverId!: string;

  @ApiProperty({
    description: 'Channel name (unique within server, unless you allow dupes)',
    example: 'general',
    minLength: 1,
    maxLength: 50,
  })
  name!: string;

  @ApiProperty({
    description: 'Channel type',
    enum: ChannelTypes as unknown as string[], // 'text' | 'qa'
    example: 'text',
  })
  type!: (typeof ChannelTypes)[number];

  @ApiProperty({
    description: 'Ordering position within the server',
    example: 0,
  })
  position!: number;

  @ApiProperty({
    description: 'Channel privacy',
    enum: PRIVACY as unknown as string[], // 'public' | 'hidden'
    example: 'public',
  })
  privacy!: (typeof PRIVACY)[number];

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601)',
    example: '2025-09-27T15:21:45.123Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601)',
    example: '2025-10-01T10:05:12.987Z',
    format: 'date-time',
  })
  updatedAt!: string;
}
