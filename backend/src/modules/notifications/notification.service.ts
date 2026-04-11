import { Injectable, Logger } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import type { FilterQuery } from 'mongoose';
import type { NotificationStatus, NotificationType } from 'src/database/types';
import {
  Notification,
  type INotification,
} from 'src/database/schemas/notification.schema';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationViewDto } from './dto/notification-view.dto';

export type MessageNotificationPayload = {
  messageId: string;
  channelId: string;
  serverId: string;
  authorId: string;
  authorName?: string;
};

export type MentionNotificationPayload = MessageNotificationPayload & {
  mentionedUserId: string;
};

type NotificationEventType = NotificationType | 'generic';

type NotificationPayloadMap = {
  'message.create': MessageNotificationPayload | NotificationViewDto;
  'message.mention': MentionNotificationPayload | NotificationViewDto;
  'channel.invite': NotificationViewDto;
  'membership.status': NotificationViewDto;
  generic: NotificationViewDto;
};

export type NotificationStreamEvent<
  T extends NotificationEventType = NotificationEventType,
> = {
  event: T;
  data: NotificationPayloadMap[T];
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly stream$ = new Subject<NotificationStreamEvent>();
  private readonly emittedNotificationIds = new Set<string>();
  private readonly emittedNotificationQueue: string[] = [];
  private readonly maxTrackedNotifications = 500;
  private readonly defaultListLimit = 50;

  get stream(): Observable<NotificationStreamEvent> {
    return this.stream$.asObservable();
  }

  async createNotification(
    dto: CreateNotificationDto,
    options?: { initialStatus?: NotificationStatus },
  ): Promise<NotificationViewDto | null> {
    const initialStatus = options?.initialStatus ?? 'unread';
    const now = new Date();

    let notification: INotification;
    try {
      notification = await Notification.create(
        this.buildNotificationDoc(dto, initialStatus, now),
      );
    } catch (err: unknown) {
      if (this.isDuplicateKeyError(err) && dto.dedupeKey) {
        this.logger.debug(
          `createNotification: dropped duplicate for dedupeKey=${dto.dedupeKey}`,
        );
        return null;
      }
      throw err;
    }

    const view = this.toNotificationView(notification);

    // Only emit live events for genuinely-unread notifications. Already-read
    // notifications exist purely as an audit trail and should not trigger UI
    // toasts or badge bumps on the recipient's active session.
    if (initialStatus !== 'read') {
      this.emitNotificationCreated(view);
    }

    return view;
  }

  /**
   * Bulk-insert a batch of notifications in a single round-trip using
   * `insertMany({ ordered: false })`. Duplicate-key failures on `dedupeKey`
   * are silently skipped; successful inserts still produce per-notification
   * SSE emits.
   */
  async createNotifications(
    dtos: CreateNotificationDto[],
    options?: { initialStatus?: NotificationStatus },
  ): Promise<NotificationViewDto[]> {
    if (!dtos.length) return [];

    const initialStatus = options?.initialStatus ?? 'unread';
    const now = new Date();
    const docs = dtos.map((dto) =>
      this.buildNotificationDoc(dto, initialStatus, now),
    );

    let inserted: INotification[] = [];
    try {
      inserted = (await Notification.insertMany(docs, {
        ordered: false,
      })) as unknown as INotification[];
    } catch (err: unknown) {
      // With ordered:false, mongoose throws a BulkWriteError that still
      // exposes the successfully-inserted docs. Duplicate-key failures on
      // dedupeKey are expected and safe to ignore.
      const bulkErr = err as {
        insertedDocs?: INotification[];
        writeErrors?: { code?: number }[];
        code?: number;
      };

      if (Array.isArray(bulkErr.insertedDocs)) {
        inserted = bulkErr.insertedDocs;
      }

      const hasNonDupeError = (bulkErr.writeErrors ?? []).some(
        (writeErr) => writeErr?.code !== 11000,
      );
      if (hasNonDupeError) {
        this.logger.warn(
          `createNotifications: partial failure — ${
            inserted.length
          }/${dtos.length} inserted, non-dedupe write errors present`,
        );
      } else if (inserted.length < dtos.length) {
        this.logger.debug(
          `createNotifications: ${
            dtos.length - inserted.length
          } duplicates skipped via dedupeKey`,
        );
      }
    }

    const views = inserted.map((doc) => this.toNotificationView(doc));
    if (initialStatus !== 'read') {
      for (const view of views) {
        this.emitNotificationCreated(view);
      }
    }
    return views;
  }

  private buildNotificationDoc(
    dto: CreateNotificationDto,
    initialStatus: NotificationStatus,
    now: Date,
  ): Record<string, unknown> {
    return {
      userId: dto.userId,
      actorId: dto.actorId,
      serverId: dto.serverId,
      serverName: dto.serverName,
      channelId: dto.channelId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data ?? {},
      dedupeKey: dto.dedupeKey,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      status: initialStatus,
      ...(initialStatus === 'read' ? { readAt: now, seenAt: now } : {}),
    };
  }

  private isDuplicateKeyError(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const code = (err as { code?: number }).code;
    return code === 11000;
  }

  async listNotifications(
    userId: string,
    options?: { status?: NotificationStatus; limit?: number; excludeActorId?: string },
  ): Promise<NotificationViewDto[]> {
    const filter: FilterQuery<INotification> = {
      userId,
    };
    if (options?.status) {
      filter.status = options.status;
    }
    if (options?.excludeActorId) {
      filter.$or = [
        { actorId: { $ne: options.excludeActorId } },
        { actorId: { $exists: false } },
      ];
    }

    const docs = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(options?.limit ?? this.defaultListLimit)
      .lean<INotification[]>();

    return docs.map((doc) => this.toNotificationView(doc));
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationViewDto | null> {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId,
      },
      {
        status: 'read',
        readAt: new Date(),
      },
      { new: true },
    ).lean<INotification | null>();

    if (!notification) {
      return null;
    }

    return this.toNotificationView(notification);
  }

  emitMessageCreated(payload: MessageNotificationPayload) {
    const event: NotificationStreamEvent<'message.create'> = {
      event: 'message.create',
      data: payload,
    };
    this.logger.debug(`SSE emit: ${event.event}`, payload);
    this.stream$.next(event);
  }

  emitMention(payload: MentionNotificationPayload) {
    const event: NotificationStreamEvent<'message.mention'> = {
      event: 'message.mention',
      data: payload,
    };
    this.logger.debug(`SSE emit: ${event.event}`, payload);
    this.stream$.next(event);
  }

  emitNotificationCreated(notification: NotificationViewDto) {
    if (this.isDuplicateNotification(notification.id)) {
      this.logger.debug(`Skipping duplicate notification ${notification.id}`);
      return;
    }

    const eventName = (notification.type ??
      'generic') as NotificationStreamEvent['event'];
    const event: NotificationStreamEvent = {
      event: eventName,
      data: notification,
    };
    this.logger.debug(`SSE emit: ${event.event}`, notification);
    this.stream$.next(event);
  }

  private isDuplicateNotification(id: string): boolean {
    if (!id) return false;
    if (this.emittedNotificationIds.has(id)) {
      return true;
    }

    this.emittedNotificationIds.add(id);
    this.emittedNotificationQueue.push(id);

    if (this.emittedNotificationQueue.length > this.maxTrackedNotifications) {
      const oldest = this.emittedNotificationQueue.shift();
      if (oldest) {
        this.emittedNotificationIds.delete(oldest);
      }
    }

    return false;
  }

  private toNotificationView(doc: INotification): NotificationViewDto {
    const toIso = (value?: Date | string | null) =>
      value ? new Date(value).toISOString() : undefined;

    return {
      id: String(doc._id),
      userId: doc.userId,
      actorId: doc.actorId,
      serverId: doc.serverId,
      serverName: doc.serverName,
      channelId: doc.channelId,
      type: doc.type,
      title: doc.title,
      body: doc.body,
      status: doc.status,
      data: doc.data ?? {},
      createdAt: toIso(doc.createdAt)!,
      updatedAt: toIso(doc.updatedAt)!,
      readAt: toIso(doc.readAt),
      seenAt: toIso(doc.seenAt),
      expiresAt: toIso(doc.expiresAt),
    };
  }
}
