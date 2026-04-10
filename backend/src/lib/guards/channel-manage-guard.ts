import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { IChannel } from 'src/database/schemas/channel.schema';
import { Channel } from 'src/database/schemas/channel.schema';
import type { IMembership } from 'src/database/schemas/membership.schema';
import { Membership } from 'src/database/schemas/membership.schema';

type ChannelManageRequest = Request<
  { serverId?: string; channelId?: string },
  any,
  { channelId?: string }
> & {
  user?: UserSession['user'];
};

@Injectable()
export class ChannelManageGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<ChannelManageRequest>();
    const authUserId = req.user?.id;
    if (!authUserId) throw new ForbiddenException('Unauthenticated');

    let serverId: string | undefined;

    const channelId = req.params.channelId ?? req.body?.channelId;

    if (channelId) {
      // Existing channel operation — resolve serverId from the channel
      const channel = await Channel.findById(channelId)
        .select('serverId')
        .lean<Pick<IChannel, 'serverId'> | null>();
      if (!channel) throw new NotFoundException('Channel not found');
      serverId = String(channel.serverId);
    } else {
      // Create operation — serverId comes from the route param
      serverId = req.params.serverId;
      if (!serverId) throw new NotFoundException('serverId missing');
    }

    const membership = await Membership.findOne({
      serverId,
      userId: authUserId,
      status: 'active',
    })
      .select('roles')
      .lean<Pick<IMembership, 'roles'> | null>();

    const roles = membership?.roles ?? [];
    const allowed = roles.includes('owner') || roles.includes('admin');

    if (!allowed) {
      throw new ForbiddenException(
        'Only server owner/admin can manage channels',
      );
    }

    return true;
  }
}
