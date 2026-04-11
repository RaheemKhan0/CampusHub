import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import type { IChannel } from 'src/database/schemas/channel.schema';
import { Channel } from 'src/database/schemas/channel.schema';
import type { IMessage } from 'src/database/schemas/message.schema';
import { Messages } from 'src/database/schemas/message.schema';
import type { IServer } from 'src/database/schemas/server.schema';
import { ServerModel } from 'src/database/schemas/server.schema';
import { ChannelsService } from '../channels/channels.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPreferenceService } from '../notifications/notification-preference.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { ChannelPresenceService } from './channel-presence.service';
import { CreateMessageDto } from './dto/message-create.dto';
import { MessageViewDto } from './dto/message-view.dto';
import { MessageListResponseDto } from './dto/message-list-response.dto';

const MAX_PAGE_SIZE = 100;
const MESSAGE_BODY_PREVIEW_LIMIT = 140;
const DAY_MS = 24 * 60 * 60 * 1000;
const MESSAGE_MENTION_TTL_MS = 30 * DAY_MS;
const MESSAGE_CREATE_TTL_MS = 14 * DAY_MS;

type ChannelLean = Pick<IChannel, '_id' | 'name'>;

type MessageQueryParams = { page?: number; pageSize?: number };

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly channelsService: ChannelsService,
    private readonly notifications: NotificationService,
    private readonly notificationPreferences: NotificationPreferenceService,
    private readonly presence: ChannelPresenceService,
  ) {}
  async createMessage(
    serverId: string,
    channelId: string,
    dto: CreateMessageDto,
    userId: string,
    authorName?: string,
  ): Promise<MessageViewDto> {
    if (!userId) throw new UnauthorizedException('Missing user context');

    if (
      !Types.ObjectId.isValid(channelId) ||
      !Types.ObjectId.isValid(serverId)
    ) {
      throw new NotFoundException('Channel not found');
    }

    const channelObjectId = new Types.ObjectId(channelId);
    const serverObjectId = new Types.ObjectId(serverId);

    const channel = await Channel.findOne({
      _id: channelObjectId,
      serverId: serverObjectId,
    })
      .select('_id name')
      .lean<ChannelLean | null>();
    if (!channel) throw new NotFoundException('Channel not found');

    const resolvedAuthorName = authorName ?? dto.authorName;
    if (!resolvedAuthorName) {
      throw new UnauthorizedException('Missing author name');
    }

    const now = new Date();
    const createdMessage = await Messages.create({
      channelId: channel._id,
      authorId: userId,
      content: dto.content,
      authorName: resolvedAuthorName,
      attachments: dto.attachments ?? [],
      mentions: dto.mentions ?? [],
      createdAt: now,
      updatedAt: now,
    });

    await this.deliverMessageNotifications({
      message: createdMessage,
      serverId,
      channelId,
      channelName: channel.name,
      authorId: userId,
      authorName: resolvedAuthorName,
      mentions: dto.mentions,
    });

    return this.toMessageView(createdMessage);
  }

  /**
   * Fans out notifications for a newly-created message.
   *
   * - Mentions: explicit @user callouts go to mentioned users who have channel
   *   access and have not muted the channel (level !== 'none').
   * - Broadcast: default is 'all', so every user with channel access gets a
   *   message.create notification UNLESS they have explicitly set their level
   *   to 'mentions' or 'none'. Author, anyone already mentioned, and users
   *   without channel access are excluded.
   */
  private async deliverMessageNotifications(args: {
    message: IMessage;
    serverId: string;
    channelId: string;
    channelName: string;
    authorId: string;
    authorName: string;
    mentions: CreateMessageDto['mentions'];
  }): Promise<void> {
    const mentions = args.mentions ?? [];

    // Collect dedupe mention ids (minus the author) upfront so we can bail early.
    const mentionTargets = new Set<string>();
    for (const mention of mentions) {
      const uid = mention?.userId;
      if (!uid || uid === args.authorId) continue;
      mentionTargets.add(uid);
    }

    // Resolve the accessible audience once.
    let accessibleUserIds: string[];
    try {
      accessibleUserIds = await this.channelsService.getAccessibleUserIds(
        args.channelId,
      );
    } catch (err) {
      this.logger.warn(
        `Message notifications: failed to resolve accessible users for channel ${args.channelId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }
    const accessibleSet = new Set(accessibleUserIds);

    // Load channel preferences once so we can filter muted and broadcast opt-outs.
    const [mutedUserIds, nonBroadcastUserIds] = await Promise.all([
      this.notificationPreferences
        .getMutedUserIds(args.channelId)
        .catch((err) => {
          this.logger.warn(
            `Message notifications: failed to load muted users for channel ${args.channelId}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          return [] as string[];
        }),
      this.notificationPreferences
        .getNonBroadcastUserIds(args.channelId)
        .catch((err) => {
          this.logger.warn(
            `Message notifications: failed to load non-broadcast users for channel ${args.channelId}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          return [] as string[];
        }),
    ]);
    const mutedSet = new Set(mutedUserIds);
    const nonBroadcastSet = new Set(nonBroadcastUserIds);

    // Filter mention targets: must have channel access and must not have muted.
    const finalMentionTargets = Array.from(mentionTargets).filter(
      (uid) => accessibleSet.has(uid) && !mutedSet.has(uid),
    );

    // Broadcast targets: default is 'all', so every accessible user receives
    // a broadcast notification UNLESS they have opted out (level = 'mentions'
    // or 'none'). Author, mentioned users, and muted users are excluded.
    const finalBroadcastTargets = accessibleUserIds.filter(
      (uid) =>
        uid !== args.authorId &&
        !mutedSet.has(uid) &&
        !nonBroadcastSet.has(uid) &&
        !mentionTargets.has(uid),
    );

    if (!finalMentionTargets.length && !finalBroadcastTargets.length) return;

    // Look up the server name once for both notification flavours.
    const server = await ServerModel.findById(args.serverId)
      .select('name')
      .lean<Pick<IServer, 'name'> | null>();
    const serverName = server?.name;

    const body =
      args.message.content.length > MESSAGE_BODY_PREVIEW_LIMIT
        ? `${args.message.content.slice(0, MESSAGE_BODY_PREVIEW_LIMIT - 3)}...`
        : args.message.content;

    const mentionTitle = `${args.authorName} mentioned you in #${args.channelName}`;
    const broadcastTitle = `New message in #${args.channelName}`;
    const messageId = String(args.message._id);
    const nowMs = Date.now();
    const mentionExpiresAt = new Date(
      nowMs + MESSAGE_MENTION_TTL_MS,
    ).toISOString();
    const broadcastExpiresAt = new Date(
      nowMs + MESSAGE_CREATE_TTL_MS,
    ).toISOString();

    // Recipients currently watching the channel get the notification
    // persisted as already-read so we keep an audit trail without inflating
    // their badge count or pushing a redundant live alert.
    const isInRoom = (userId: string) =>
      this.presence.isPresent(args.channelId, userId);

    // Partition recipients by status so we can bulk-insert each bucket in
    // one round-trip instead of one call per user.
    type Bucket = { read: CreateNotificationDto[]; unread: CreateNotificationDto[] };
    const buckets: Bucket = { read: [], unread: [] };

    const push = (
      bucket: 'read' | 'unread',
      payload: CreateNotificationDto,
    ) => {
      buckets[bucket].push(payload);
    };

    for (const userId of finalMentionTargets) {
      push(isInRoom(userId) ? 'read' : 'unread', {
        userId,
        actorId: args.authorId,
        channelId: args.channelId,
        serverId: args.serverId,
        serverName,
        type: 'message.mention',
        title: mentionTitle,
        body,
        data: { messageId },
        dedupeKey: `message.mention:${userId}:${messageId}`,
        expiresAt: mentionExpiresAt,
      });
    }

    for (const userId of finalBroadcastTargets) {
      push(isInRoom(userId) ? 'read' : 'unread', {
        userId,
        actorId: args.authorId,
        channelId: args.channelId,
        serverId: args.serverId,
        serverName,
        type: 'message.create',
        title: broadcastTitle,
        body,
        data: { messageId },
        dedupeKey: `message.create:${userId}:${messageId}`,
        expiresAt: broadcastExpiresAt,
      });
    }

    try {
      await Promise.all([
        this.notifications.createNotifications(buckets.unread, {
          initialStatus: 'unread',
        }),
        this.notifications.createNotifications(buckets.read, {
          initialStatus: 'read',
        }),
      ]);
    } catch (err) {
      this.logger.warn(
        `Failed to fan out message notifications for channel ${args.channelId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async listMessages(
    serverId: string,
    channelId: string,
    params: MessageQueryParams,
  ): Promise<MessageListResponseDto> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, params.pageSize ?? 50),
    );

    if (
      !Types.ObjectId.isValid(channelId) ||
      !Types.ObjectId.isValid(serverId)
    ) {
      throw new NotFoundException('Channel not found');
    }

    const channelObjectId = new Types.ObjectId(channelId);
    const serverObjectId = new Types.ObjectId(serverId);

    const channel = await Channel.findOne({
      _id: channelObjectId,
      serverId: serverObjectId,
    })
      .select('_id')
      .lean<ChannelLean | null>();
    if (!channel) throw new NotFoundException('Channel not found');

    const query = Messages.find({ channelId: channel._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<IMessage[]>()
      .exec();

    const [items, total] = await Promise.all([
      query,
      Messages.countDocuments({ channelId: channel._id }),
    ]);

    const ordered = items.reverse();

    return {
      items: ordered.map((doc) => this.toMessageView(doc)),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  private toMessageView(doc: IMessage): MessageViewDto {
    const toIso = (value: Date | string | undefined): string =>
      new Date(value ?? Date.now()).toISOString();

    return {
      id: String(doc._id),
      channelId: String(doc.channelId),
      authorId: doc.authorId,
      authorName: doc.authorName,
      content: doc.content,
      attachments: doc.attachments ?? [],
      mentions: doc.mentions ?? [],
      editedAt: doc.editedAt ? toIso(doc.editedAt) : undefined,
      createdAt: toIso(doc.createdAt),
      updatedAt: toIso(doc.updatedAt),
    };
  }
}
