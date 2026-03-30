import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

import {
  NotificationTypes,
  type NotificationType,
} from 'src/database/types';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Recipient BetterAuth user id',
    example: 'usr_01hxt8zshm8yc6a5n8s6k1qj3r',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

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
    description: 'Structured context payload (server/channel/message ids)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
