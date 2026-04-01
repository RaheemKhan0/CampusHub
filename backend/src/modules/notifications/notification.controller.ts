import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { NotificationService } from './notification.service';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationViewDto } from './dto/notification-view.dto';

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
}
