import { Body, Controller, Get, Post, Sse, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { NotificationService } from './notification.service';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationViewDto } from './dto/notification-view.dto';
import type { MessageEvent, Request } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { filter, map } from 'rxjs';

@Controller('/notifications')
@UseGuards(AuthGuard)
export class NotificationContoller {
  private readonly logger = new Logger(NotificationContoller.name);

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

  @Get('unread')
  @ApiOperation({ summary: 'List unread notifications for the current user' })
  @ApiOkResponse({ type: NotificationViewDto, isArray: true })
  async listUnread(@Session() session: UserSession) {
    return this.notifications.listNotifications(session.user.id, {
      status: 'unread',
    });
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
        const actorId = (payload.data as any)?.actorId;
        if (!currentUserId) {
          this.logger.verbose('Rejecting SSE event because client userId is missing');
          return false;
        }
        if (actorId && actorId === currentUserId) {
          this.logger.verbose(
            `Skipping SSE event for user=${currentUserId} because actorId matches`,
          );
          return false;
        }
        return true;
      }),
      map((payload): MessageEvent => ({
        data: JSON.stringify(payload.data),
        type: payload.event,
      })),
    );
  }
}
