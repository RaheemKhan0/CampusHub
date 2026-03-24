import { Module } from '@nestjs/common';

import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { ChannelAccessGuard } from 'src/lib/guards/channel-access-guard';
import { WsAuthGuard } from 'src/lib/guards/WsAuthGuard';

@Module({
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway,
    ChannelAccessGuard,
    WsAuthGuard,
  ],
  exports: [MessagesService],
})
export class MessagesModule {}
