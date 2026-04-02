import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import type { NotificationType } from 'src/database/types';
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

type NotificationPayloadMap = {
  'message.create': MessageNotificationPayload;
  'message.mention': MentionNotificationPayload;
  'channel.invite': NotificationViewDto;
  'membership.status': NotificationViewDto;
  generic: NotificationViewDto;
};

export type NotificationStreamEvent<T extends NotificationType = NotificationType> = {
  event: T;
  data: NotificationPayloadMap[T];
};

@Injectable()
export class NotificationService {
  private readonly stream$ = new Subject<NotificationStreamEvent>();

  get stream(): Observable<NotificationStreamEvent> {
    return this.stream$.asObservable();
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationViewDto> {
    const notification = await Notification.create({
      userId: dto.userId,
      actorId: dto.actorId,
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

  emitMessageCreated(payload: MessageNotificationPayload) {
    this.stream$.next({
      event: 'message.create',
      data: payload,
    });
  }

  emitMention(payload: MentionNotificationPayload) {
    this.stream$.next({
      event: 'message.mention',
      data: payload,
    });
  }

  emitNotificationCreated(notification: NotificationViewDto) {
    this.stream$.next({
      event: 'generic',
      data: notification,
    });
  }

  private toNotificationView(doc: INotification): NotificationViewDto {
    const toIso = (value?: Date | string | null) =>
      value ? new Date(value).toISOString() : undefined;

    return {
      id: String(doc._id),
      userId: doc.userId,
      actorId: doc.actorId,
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
