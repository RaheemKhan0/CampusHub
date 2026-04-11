import { Module } from '@nestjs/common';

import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { ChannelPresenceService } from './channel-presence.service';
import { ChannelAccessGuard } from 'src/lib/guards/channel-access-guard';
import { WsAuthGuard } from 'src/lib/guards/WsAuthGuard';
import { ChannelModule } from '../channels/channels.module';
import { NotificationsModule } from '../notifications/notification.module';

@Module({
  imports: [ChannelModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway,
    ChannelPresenceService,
    ChannelAccessGuard,
    WsAuthGuard,
  ],
  exports: [MessagesService, ChannelPresenceService],
})
export class MessagesModule {}
