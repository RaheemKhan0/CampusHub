import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import {
  DEFAULT_NOTIFICATION_PREFERENCE_LEVEL,
  INotificationPreference,
  NotificationPreference,
  type NotificationPreferenceLevel,
} from 'src/database/schemas/notification-preference.schema';
import { NotificationPreferenceViewDto } from './dto/notification-preference.dto';

@Injectable()
export class NotificationPreferenceService {
  async get(
    userId: string,
    channelId: string,
  ): Promise<NotificationPreferenceViewDto> {
    this.assertValidChannelId(channelId);
    const doc = await NotificationPreference.findOne({
      channelId: new Types.ObjectId(channelId),
      userId,
    })
      .select('level')
      .lean<Pick<INotificationPreference, 'level'> | null>();

    return {
      channelId,
      level: doc?.level ?? DEFAULT_NOTIFICATION_PREFERENCE_LEVEL,
    };
  }

  async set(
    userId: string,
    channelId: string,
    level: NotificationPreferenceLevel,
  ): Promise<NotificationPreferenceViewDto> {
    this.assertValidChannelId(channelId);
    const channelObjectId = new Types.ObjectId(channelId);

    // Default level: remove the explicit row so the user falls back to defaults.
    if (level === DEFAULT_NOTIFICATION_PREFERENCE_LEVEL) {
      await NotificationPreference.deleteOne({
        channelId: channelObjectId,
        userId,
      });
      return { channelId, level };
    }

    await NotificationPreference.updateOne(
      { channelId: channelObjectId, userId },
      { $set: { level }, $setOnInsert: { channelId: channelObjectId, userId } },
      { upsert: true },
    );

    return { channelId, level };
  }

  /**
   * Returns user IDs that should NOT receive broadcast (non-mention) message
   * notifications for this channel — i.e. users who have explicitly set their
   * level to 'mentions' or 'none'. With the default being 'all', users without
   * any row are broadcast recipients by default.
   */
  async getNonBroadcastUserIds(channelId: string): Promise<string[]> {
    this.assertValidChannelId(channelId);
    const docs = await NotificationPreference.find({
      channelId: new Types.ObjectId(channelId),
      level: { $in: ['mentions', 'none'] },
    })
      .select('userId')
      .lean<Pick<INotificationPreference, 'userId'>[]>();
    return docs.map((d) => d.userId);
  }

  /** Returns user IDs that explicitly muted this channel. */
  async getMutedUserIds(channelId: string): Promise<string[]> {
    this.assertValidChannelId(channelId);
    const docs = await NotificationPreference.find({
      channelId: new Types.ObjectId(channelId),
      level: 'none',
    })
      .select('userId')
      .lean<Pick<INotificationPreference, 'userId'>[]>();
    return docs.map((d) => d.userId);
  }

  private assertValidChannelId(channelId: string): void {
    if (!Types.ObjectId.isValid(channelId)) {
      throw new NotFoundException('Channel not found');
    }
  }
}
