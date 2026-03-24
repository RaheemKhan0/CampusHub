import { ApiProperty } from '@nestjs/swagger';
import { MessageViewDto } from './message-view.dto';

export class MessageListResponseDto {
  @ApiProperty({
    description:
      'Messages ordered chronologically (oldest to newest unless specified)',
    type: [MessageViewDto],
    isArray: true,
  })
  items!: MessageViewDto[];

  @ApiProperty({
    description: 'Total messages available for the current filter',
    example: 125,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page when using page-based pagination',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of messages per page',
    example: 50,
  })
  pageSize!: number;

  @ApiProperty({
    description: 'Whether additional pages are available',
    example: false,
  })
  hasMore!: boolean;
}
