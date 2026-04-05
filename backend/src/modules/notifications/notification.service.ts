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

export type NotificationStreamEvent<T extends NotificationEventType = NotificationEventType> = {
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
  ): Promise<NotificationViewDto> {
    const notification = await Notification.create({
      userId: dto.userId,
      actorId: dto.actorId,
      serverId: dto.serverId,
      serverName: dto.serverName,
      channelId: dto.channelId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data ?? {},
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    const view = this.toNotificationView(notification);
    this.emitNotificationCreated(view);

    return view;
  }

  async listNotifications(
    userId: string,
    options?: { status?: NotificationStatus; limit?: number },
  ): Promise<NotificationViewDto[]> {
    const filter: FilterQuery<INotification> = { userId };
    if (options?.status) {
      filter.status = options.status;
    }

    const docs = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(options?.limit ?? this.defaultListLimit)
      .lean<INotification[]>();

    return docs.map((doc) => this.toNotificationView(doc));
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

    const eventName = (notification.type ?? 'generic') as NotificationStreamEvent['event'];
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
