import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { IMembership } from 'src/database/schemas/membership.schema';
import { Membership } from 'src/database/schemas/membership.schema';
import type { IServer } from 'src/database/schemas/server.schema';
import { ServerModel } from 'src/database/schemas/server.schema';
import type { IUser } from 'src/database/schemas/user.schema';
import { AppUser } from 'src/database/schemas/user.schema';
import type { IDegree } from 'src/database/schemas/degree.schema';
import { Degree } from 'src/database/schemas/degree.schema';

type ServerRequest = Request<{ serverId?: string }> & {
  user?: UserSession['user'];
};

@Injectable()
export class ServerMemberGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<ServerRequest>();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Unauthenticated');

    const serverId = req.params.serverId;
    if (!serverId) throw new NotFoundException('serverId missing');

    const server = await ServerModel.findById(serverId)
      .select('type degreeId')
      .lean<Pick<IServer, 'type' | 'degreeId'> | null>();
    if (!server) throw new NotFoundException('Server not found');

    if (server.type === 'unimodules') {
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

      return true;
    }

    // Society servers: allow listing channels freely so users can browse
    if (server.type === 'citysocieties') {
      return true;
    }

    // All other types: require active membership
    const membership = await Membership.findOne({
      serverId,
      userId,
      status: 'active',
    })
      .select('_id')
      .lean<Pick<IMembership, '_id'> | null>();

    if (!membership) throw new ForbiddenException('Not a member of this server');

    return true;
  }
}
