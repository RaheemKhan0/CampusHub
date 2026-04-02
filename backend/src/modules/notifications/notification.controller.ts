import { Body, Controller, Post, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { NotificationService } from './notification.service';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationViewDto } from './dto/notification-view.dto';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

@Controller('/notifications')
@UseGuards(AuthGuard)
export class NotificationContoller {
  constructor(private readonly notifications: NotificationService) {}

  @Post()
  @ApiOperation({
    summary: 'Creates notificaion in the database for the specified user',
  })
  @ApiCreatedResponse({ type: NotificationViewDto })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notifications.createNotification({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      actorId: dto.actorId,
    });
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.notifications.stream.pipe(
      map((payload): MessageEvent => ({
        data: JSON.stringify(payload.data),
        type: payload.event,
      })),
    );
  }
}
