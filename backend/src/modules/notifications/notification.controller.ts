import { Body, Controller, Get, Param, Patch, Post, Put, Sse, UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { AuthGuard, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { NotificationService } from './notification.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationViewDto } from './dto/notification-view.dto';
import {
  NotificationPreferenceViewDto,
  UpdateNotificationPreferenceDto,
} from './dto/notification-preference.dto';
import type { MessageEvent, Request } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { filter, map } from 'rxjs';

@Controller('/notifications')
@UseGuards(AuthGuard)
export class NotificationContoller {
  private readonly logger = new Logger(NotificationContoller.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly preferences: NotificationPreferenceService,
  ) {}

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

  @Get('unread')
  @ApiOperation({ summary: 'List unread notifications for the current user' })
  @ApiOkResponse({ type: NotificationViewDto, isArray: true })
  async listUnread(@Session() session: UserSession) {
    return this.notifications.listNotifications(session.user.id, {
      status: 'unread',
      excludeActorId: session.user.id,
    });
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ type: NotificationViewDto })
  async markRead(
    @Param('notificationId') notificationId: string,
    @Session() session: UserSession,
  ) {
    const updated = await this.notifications.markAsRead(
      session.user.id,
      notificationId,
    );
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
    return updated;
  }

  @Get('preferences/channels/:channelId')
  @ApiOperation({
    summary: "Get the current user's notification preference for a channel",
  })
  @ApiParam({ name: 'channelId', type: String })
  @ApiOkResponse({ type: NotificationPreferenceViewDto })
  async getChannelPreference(
    @Session() session: UserSession,
    @Param('channelId') channelId: string,
  ): Promise<NotificationPreferenceViewDto> {
    return this.preferences.get(session.user.id, channelId);
  }

  @Put('preferences/channels/:channelId')
  @ApiOperation({
    summary: "Update the current user's notification preference for a channel",
  })
  @ApiParam({ name: 'channelId', type: String })
  @ApiOkResponse({ type: NotificationPreferenceViewDto })
  async setChannelPreference(
    @Session() session: UserSession,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceViewDto> {
    return this.preferences.set(session.user.id, channelId, dto.level);
  }

  @Sse('stream')
  stream(@Req() req: Request): Observable<MessageEvent> {
    const currentUserId = (req as any).user?.id as string | undefined;
    const currentUserName = (req as any).user?.name as string | undefined;
    this.logger.debug(
      `Client subscribed to /notifications/stream user=${currentUserId ?? 'unknown'} name=${currentUserName ?? 'unknown'}`,
    );
    return this.notifications.stream.pipe(
      filter((payload) => {
        if (!currentUserId) {
          this.logger.verbose(
            'Rejecting SSE event because client userId is missing',
          );
          return false;
        }
        const data = payload.data as {
          userId?: string;
          actorId?: string;
        };

        // CRITICAL: only forward notifications whose recipient matches the
        // subscriber. The stream is a single shared Subject, so every client
        // receives every event — without this filter, userA sees userB's
        // notifications.
        const recipientId = data?.userId;
        if (recipientId && recipientId !== currentUserId) {
          return false;
        }

        // Defence in depth — drop events the user authored themselves.
        if (data?.actorId && data.actorId === currentUserId) {
          return false;
        }
        return true;
      }),
      map(
        (payload): MessageEvent => ({
          data: JSON.stringify(payload.data),
          type: payload.event,
        }),
      ),
    );
  }
}
