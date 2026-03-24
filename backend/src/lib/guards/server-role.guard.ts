// src/guards/server-roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Session } from '../betterauth';
import { SERVER_ROLES_KEY } from '../decorators/server-roles.decorator';
import type { IMembership } from 'src/database/schemas/membership.schema';
import { Membership } from 'src/database/schemas/membership.schema';
import { Role } from 'src/database/types';

type ServerRequest = Request<{ serverId?: string }> & {
  user?: Session['user'];
  membership?: Pick<IMembership, 'roles' | 'userId' | 'serverId'>;
};

@Injectable()
export class ServerRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(
      SERVER_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<ServerRequest>();

    const authUserId = req.user?.id;
    if (!authUserId) throw new ForbiddenException('Unauthenticated');
    const serverId = req.params?.serverId;
    if (!serverId) throw new NotFoundException('serverId missing');

    const membership = await Membership.findOne({
      serverId,
      userId: authUserId,
    })
      .select('roles userId serverId')
      .lean<Pick<IMembership, 'roles' | 'userId' | 'serverId'> | null>();

    if (!membership) {
      throw new ForbiddenException('Not a member of this server');
    }

    const memberRoles = membership.roles ?? [];
    const ok = required.some((role) => memberRoles.includes(role));
    if (!ok) throw new ForbiddenException('Insufficient server role');

    req.membership = membership;
    return true;
  }
}
