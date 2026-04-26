import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { Session } from '../betterauth';
import { auth } from '../betterauth';
import { convertIncomingHttpHeaders } from '../utils/convertIncomingHttpHeaders';

type SocketAuthData = {
  session?: Session;
  user?: Session['user'];
};

type AuthedSocket = Socket & { data?: SocketAuthData };

@Injectable()
export class WsAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthedSocket>();

    const data = client.data as SocketAuthData | undefined;
    if (data?.session?.user?.id) {
      return true;
    }

    const headers = client.handshake?.headers;
    if (!headers) {
      throw new WsException('Unauthorized');
    }

    const convertedHeaders = convertIncomingHttpHeaders(headers);

    let session: Session | null = null;
    try {
      session = (await auth.api.getSession({
        headers: convertedHeaders,
      })) as Session | null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      throw new WsException('Unauthorized');
    }

    if (!session?.user?.id) {
      throw new WsException('Unauthorized');
    }

    const socketData: SocketAuthData = {
      ...(data ?? {}),
      session,
      user: session.user,
    };
    client.data = socketData;

    return true;
  }
}
