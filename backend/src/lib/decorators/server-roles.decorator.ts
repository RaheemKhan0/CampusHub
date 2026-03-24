import { SetMetadata } from '@nestjs/common';

export const SERVER_ROLES_KEY = 'serverRoles';
export const ServerRole = (...roles: string[]) =>
  SetMetadata(SERVER_ROLES_KEY, roles);
