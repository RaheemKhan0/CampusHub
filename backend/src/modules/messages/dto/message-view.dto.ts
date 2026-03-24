import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentViewDto } from './message-attachment.dto';
import { MentionViewDto } from './message-mention.dto';

export class MessageViewDto {
  @ApiProperty({
    description: 'Message identifier',
    example: '6750a4f2f23a5a2c5f6f8a1b',
  })
  id!: string;

  @ApiProperty({
    description: 'Channel identifier this message belongs to',
    example: '6710a4f2f23a5a2c5f6f8a1b',
  })
  channelId!: string;

  @ApiProperty({
    description: 'Author identifier (BetterAuth user id)',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qj3r',
  })
  authorId!: string;

  @ApiProperty({
    description: 'Name of the Author',
    example: 'Khan',
  })
  authorName!: string;

  @ApiProperty({
    description: 'Message Markdown/text content',
    maxLength: 4000,
  })
  content!: string;

  @ApiPropertyOptional({
    description: 'Attachments included with the message',
    type: [AttachmentViewDto],
    isArray: true,
  })
  attachments?: AttachmentViewDto[];

  @ApiPropertyOptional({
    description: 'User mentions referenced in the message',
    type: [MentionViewDto],
    isArray: true,
  })
  mentions?: MentionViewDto[];

  @ApiPropertyOptional({
    description: 'Timestamp of last edit in ISO 8601 format',
    example: '2025-10-01T10:05:12.987Z',
    format: 'date-time',
  })
  editedAt?: string;

  @ApiProperty({
    description: 'Message creation timestamp (ISO 8601)',
    example: '2025-09-27T15:21:45.123Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601)',
    example: '2025-10-01T11:05:12.987Z',
    format: 'date-time',
  })
  updatedAt!: string;
}
