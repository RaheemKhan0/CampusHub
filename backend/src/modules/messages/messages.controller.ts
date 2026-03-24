import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/message-create.dto';
import { MessageViewDto } from './dto/message-view.dto';
import { MessageListResponseDto } from './dto/message-list-response.dto';
import { ChannelAccessGuard } from 'src/lib/guards/channel-access-guard';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('messages')
@Controller('servers/:serverId/channels/:channelId/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @UseGuards(ChannelAccessGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new message in the channel' })
  @ApiCreatedResponse({ type: MessageViewDto })
  async create(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() dto: CreateMessageDto,
    @Session() session: UserSession,
  ): Promise<MessageViewDto> {
    return this.messages.createMessage(
      serverId,
      channelId,
      dto,
      session.user.id,
      session.user.name ?? dto.authorName,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List messages in the channel' })
  @ApiOkResponse({ type: MessageListResponseDto })
  async listMessages(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<MessageListResponseDto> {
    return this.messages.listMessages(serverId, channelId, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
