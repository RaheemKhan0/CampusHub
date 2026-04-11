import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import {
  NotificationPreferenceLevels,
  type NotificationPreferenceLevel,
} from 'src/database/schemas/notification-preference.schema';

export class NotificationPreferenceViewDto {
  @ApiProperty({ description: 'Target channel id' })
  channelId!: string;

  @ApiProperty({
    description: 'Notification level for this channel',
    enum: NotificationPreferenceLevels,
  })
  level!: NotificationPreferenceLevel;
}

export class UpdateNotificationPreferenceDto {
  @ApiProperty({
    description: 'Notification level for this channel',
    enum: NotificationPreferenceLevels,
    example: 'all',
  })
  @IsEnum(NotificationPreferenceLevels)
  level!: NotificationPreferenceLevel;
}
