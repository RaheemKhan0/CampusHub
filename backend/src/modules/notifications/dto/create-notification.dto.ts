import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { NotificationTypes, type NotificationType } from 'src/database/types';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Recipient BetterAuth user id',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qj3r',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Channel identifier (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiProperty({
    description: 'Server identifier (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  serverId?: string;

  @ApiProperty({
    description: 'Server name (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  serverName?: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'message.mention',
    enum: NotificationTypes,
  })
  @IsString()
  @IsEnum(NotificationTypes)
  type!: NotificationType;

  @ApiProperty({
    description: 'Primary title for display',
    example: 'New mention in #freshers',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Optional body or preview text',
    example: 'Alice mentioned you in #freshers',
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({
    description: 'Actor user id triggering the notification',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qabc',
    required: false,
  })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiProperty({
    description: 'Structured context payload (server/channel/message ids)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiProperty({
    description: 'Expiry timestamp; notification auto-deletes afterwards',
    example: '2024-05-20T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiProperty({
    description:
      'Globally-unique dedupe key; duplicate creates with the same key are silently dropped',
    required: false,
  })
  @IsOptional()
  @IsString()
  dedupeKey?: string;
}
