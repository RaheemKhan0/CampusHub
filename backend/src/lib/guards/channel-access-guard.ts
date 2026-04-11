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
import type { IUser } from 'src/database/schemas/user.schema';
import { AppUser } from 'src/database/schemas/user.schema';
import type { IDegree } from 'src/database/schemas/degree.schema';
import { Degree } from 'src/database/schemas/degree.schema';
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

    const server = await ServerModel.findById(channel.serverId)
      .select('type degreeId')
      .lean<Pick<IServer, 'type' | 'degreeId'> | null>();
    if (!server) throw new NotFoundException('Server not found');

    if (server.type === 'unimodules') {
      // Degree match check — no membership record required
      const user = await AppUser.findOne({ userId })
        .select('degreeSlug')
        .lean<Pick<IUser, 'degreeSlug'> | null>();
      if (!user) throw new ForbiddenException('User profile not found');

      const degree = await Degree.findOne({ slug: user.degreeSlug })
        .select('_id')
        .lean<Pick<IDegree, '_id'> | null>();
      if (!degree) throw new ForbiddenException('Degree not found');

      if (String(server.degreeId) !== String(degree._id)) {
        throw new ForbiddenException('This server is not part of your degree');
      }

      // For hidden channels in unimodules, still enforce ChannelAccess
      if (channel.privacy === 'hidden') {
        const access = await ChannelAccess.findOne({ channelId: channel._id, userId })
          .select('_id')
          .lean<IChannelAccess | null>();
        if (!access) throw new ForbiddenException('No access to this channel');
      }

      return true;
    }

    // Society servers and all other types: require membership
    const roleDoc = await Membership.findOne({
      serverId: channel.serverId,
      userId,
      status: 'active',
    })
      .select('roles')
      .lean<Pick<IMembership, 'roles'> | null>();

    if (!roleDoc) throw new ForbiddenException('Not a member of this server');

    if (channel.privacy === 'hidden') {
      const isAdmin =
        roleDoc.roles.includes('owner') || roleDoc.roles.includes('admin');
      if (isAdmin) return true;

      const access = await ChannelAccess.findOne({ channelId: channel._id, userId })
        .select('_id')
        .lean<IChannelAccess | null>();
      if (!access) throw new ForbiddenException('No access to this channel');
    }

    return true;
  }
}
