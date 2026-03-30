import { UseGuards, UsePipes, Injectable, ValidationPipe } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { NotificationService } from "./notification.service";
import { WsAuthGuard } from "src/lib/guards/WsAuthGuard";
import { Server, Socket } from 'socket.io';

const DEFAULT_ORIGIN = 'http://localhost:3000';

interface GatewayUser {
  id: string;
  name?: string;
  [key: string]: unknown;
}

type GatewaySocket = Socket & { data?: { user?: GatewayUser } };

@UseGuards(WsAuthGuard)
@UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
)
@WebSocketGateway({
  namespace: 'messages',
  cors: {
    origin: (process.env.CORS_ORIGIN ?? DEFAULT_ORIGIN)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
@Injectable()
export class NotificationGateway {
  
  constructor (private readonly notificationService : NotificationService) {}
  @WebSocketServer()
  server!: Server;
 
  handleConnection(client: GatewaySocket) {
    
  }
  handleDisconnect(client: GatewaySocket) {

  }
  

}

