// channel-access.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { IChannel } from 'src/database/schemas/channel.schema';
import { Channel } from 'src/database/schemas/channel.schema';
import type { IChannelAccess } from 'src/database/schemas/channel-access.schema';
import { ChannelAccess } from 'src/database/schemas/channel-access.schema';
import type { IMembership } from 'src/database/schemas/membership.schema';
import { Membership } from 'src/database/schemas/membership.schema';
import type { IServer } from 'src/database/schemas/server.schema';
import { ServerModel } from 'src/database/schemas/server.schema';
import type { UserSession } from '@thallesp/nestjs-better-auth';

type ChannelRequest = Request<{ channelId: string }> & {
  session?: UserSession;
};

@Injectable()
export class ChannelAccessGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<ChannelRequest>();
    const session = req.session;
    const userId = session?.user?.id;
    if (!userId) throw new ForbiddenException('Unauthenticated');

    const { channelId } = req.params;
    if (!channelId) throw new NotFoundException('channelId missing');

    const channel = await Channel.findById(channelId).lean<IChannel>();
    if (!channel) throw new NotFoundException('Channel not found');

    const server = await ServerModel.findById(channel.serverId).lean<IServer>();

    if (server && server.type == 'unimodules') {
      return true;
    }

    // Public: must at least be a member of the server
    if (channel.privacy === 'public') {
      const membership = await Membership.findOne({
        serverId: channel.serverId,
        userId,
        status: 'active',
      })
        .select('_id')
        .lean<Pick<IMembership, '_id'> | null>();
      if (!membership)
        throw new ForbiddenException('Not a member of this server');
      return true;
    }

    // Hidden: allow server owner/admin or explicit channel access
    const roleDoc = await Membership.findOne({
      serverId: channel.serverId,
      userId,
      status: 'active',
    })
      .select('roles')
      .lean<Pick<IMembership, 'roles'> | null>();
    const roles = roleDoc?.roles ?? [];
    const isServerAdmin = roles.includes('owner') || roles.includes('admin');
    if (isServerAdmin) return true;

    const access = await ChannelAccess.findOne({
      channelId: channel._id,
      userId,
    })
      .select('_id')
      .lean<IChannelAccess | null>();
    if (!access) throw new ForbiddenException('No access to this channel');

    return true;
  }
}
