import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { Session } from '../betterauth';
import { auth } from '../betterauth';
import { convertIncomingHttpHeaders } from '../utils/convertIncomingHttpHeaders';
import { Logger } from '@nestjs/common';

type SocketAuthData = {
  session?: Session;
  user?: Session['user'];
};

type AuthedSocket = Socket & { data?: SocketAuthData };

@Injectable()
export class WsAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthedSocket>();
    const logger = new Logger(WsAuthGuard.name);

    const data = client.data as SocketAuthData | undefined;
    if (data?.session?.user?.id) {
      logger.log(`socket ${client.id}: session already present, skipping auth`);
      return true;
    }

    const headers = client.handshake?.headers;
    logger.log(`socket ${client.id}: authenticating, received handshake headers`);
    if (!headers) {
      logger.warn(`socket ${client.id}: missing headers, rejecting`);
      throw new WsException('Unauthorized');
    }

    const convertedHeaders = convertIncomingHttpHeaders(headers);
    logger.debug(
      `socket ${client.id}: converted headers for better-auth lookup`,
    );

    let session: Session | null = null;
    try {
      logger.log(`socket ${client.id}: fetching session from better-auth`);
      session = (await auth.api.getSession({
        headers: convertedHeaders,
      })) as Session | null;
    } catch (error) {
      const err = error as Error;
      logger.error(`socket ${client.id}: failed to fetch session`, err.stack);

      throw new WsException('Unauthorized');
    }

    if (!session?.user?.id) {
      logger.warn(`socket ${client.id}: session missing user id, rejecting`);
      throw new WsException('Unauthorized');
    }

    const socketData: SocketAuthData = {
      ...(data ?? {}),
      session,
      user: session.user,
    };
    client.data = socketData;
    logger.log(
      `socket ${client.id}: session appended, user=${session.user.id}`,
    );

    return true;
  }
}
