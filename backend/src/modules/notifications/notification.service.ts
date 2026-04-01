import { Injectable } from '@nestjs/common';

import {
  Notification,
  type INotification,
} from 'src/database/schemas/notification.schema';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationViewDto } from './dto/notification-view.dto';

@Injectable()
export class NotificationService {
  async createNotification(dto: CreateNotificationDto): Promise<NotificationViewDto> {
    const notification = await Notification.create({
      userId: dto.userId,
      actorId: dto.actorId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data ?? {},
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    return this.toNotificationView(notification);
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
