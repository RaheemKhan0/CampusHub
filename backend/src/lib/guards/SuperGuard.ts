import { Reflector } from '@nestjs/core';
import { SUPER_KEY } from '../decorators/super.decorator';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SuperGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const needsSuper = this.reflector.getAllAndOverride<boolean>(SUPER_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!needsSuper) return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req?.user?.isSuper) return true;
    throw new ForbiddenException('Super permissions required');
  }
}
