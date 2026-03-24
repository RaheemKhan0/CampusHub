// channels.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ChannelManageGuard } from 'src/lib/guards/channel-manage-guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ChannelListResponseDto } from './dto/channel-list.dto';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ChannelViewDto } from './dto/channel-view.dto';

@Controller('servers/:serverId/channels')
export class ChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Post()
  @UseGuards(ChannelManageGuard)
  create(@Param('serverId') serverId: string, @Body() dto: CreateChannelDto) {
    return this.channels.create(serverId, dto);
  }

  @Get()
  @ApiOkResponse({
    type: ChannelListResponseDto,
    description: 'returns a channel list visible to the user',
  })
  list(
    @Param('serverId') serverId: string,
    @Session() session: UserSession,
  ): Promise<ChannelListResponseDto> {
    return this.channels.listVisible(session.user.id, serverId);
  }

  @Get(':channelId')
  @ApiOkResponse({
    type: ChannelViewDto,
    description: 'returns the desired channel',
  })
  find(@Param('channelId') channelId: string) {
    return this.channels.findChannel(channelId);
  }

  @Post(':channelId/members')
  @UseGuards(ChannelManageGuard)
  @ApiCreatedResponse({
    description:
      'returns when adding a member in ther channel if the channel is hidden',
  })
  addMembers(
    @Param('channelId') channelId: string,
    @Body() body: { userId: string },
  ) {
    const ids = body.userId;
    return this.channels.addMember(channelId, ids);
  }

  @Delete(':channelId/members/:userId')
  @UseGuards(ChannelManageGuard)
  @ApiOkResponse({
    description: 'this handler deletes a member from the channel',
  })
  removeMember(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
  ) {
    return this.channels.removeMember(channelId, userId);
  }
  /*
    @Patch(':channelId')
    @UseGuards(ChannelManageGuard)
    update(
      @Param('serverId') serverId: string,
      @Param('channelId') channelId: string,
      @Body() dto: UpdateChannelDto,
    ) {
      return this.channels.update(serverId, channelId, dto);
    }
    */
  /*
    @Patch(':channelId/position')
    @UseGuards(ChannelManageGuard)
    reorder(
      @Param('serverId') serverId: string,
      @Param('channelId') channelId: string,
      @Body() dto: { position: number },
    ) {
      return this.channels.reorder(serverId, channelId, dto.position);
    }
    */
}
