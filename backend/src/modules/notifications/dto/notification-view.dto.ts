import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  NotificationStatusTypes,
  NotificationTypes,
  type NotificationStatus,
  type NotificationType,
} from 'src/database/types';

export class NotificationViewDto {
  @ApiProperty({
    description: 'Notification identifier',
    example: 'ntf_01hyf4a12x3n8zg9c0p7',
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Recipient user id',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qj3r',
  })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Actor user id if applicable',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qabc',
  })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({
    description: 'Server identifier associated with this notification',
    example: 'srv_01hxt8zshm8yc6a5n8s6k1qz9x',
  })
  @IsOptional()
  @IsString()
  serverId?: string;

  @ApiPropertyOptional({
    description: 'Server name for display',
    example: 'Physics 101',
  })
  @IsOptional()
  @IsString()
  serverName?: string;

  @ApiPropertyOptional({
    description: 'Channel identifier if the notification targets a channel',
    example: 'chn_01hxt8zshm8yc6a5n8s6k1qy1m',
  })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiProperty({
    description: 'Notification type discriminator',
    example: 'message.mention',
    enum: NotificationTypes,
  })
  @IsEnum(NotificationTypes)
  type!: NotificationType;

  @ApiProperty({
    description: 'Display title',
    example: 'New mention in #freshers',
  })
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Optional body/preview',
    example: 'Alice mentioned you in #freshers',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({
    description: 'Current status',
    enum: NotificationStatusTypes,
    example: 'unread',
  })
  @IsEnum(NotificationStatusTypes)
  status!: NotificationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-05-16T09:15:30.000Z',
  })
  @IsString()
  @IsISO8601()
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-05-16T09:15:30.000Z',
  })
  @IsString()
  @IsISO8601()
  updatedAt!: string;

  @ApiPropertyOptional({
    description: 'Read timestamp if set',
    example: '2024-05-16T10:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  readAt?: string;

  @ApiPropertyOptional({
    description: 'Seen timestamp for badge counts',
    example: '2024-05-16T10:05:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  seenAt?: string;

  @ApiPropertyOptional({
    description: 'Expiry timestamp (auto-clean via TTL)',
    example: '2024-05-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
