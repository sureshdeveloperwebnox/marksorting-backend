import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      const allowed =
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
        /^https:\/\/.*\.ngrok(-free)?\.(app|dev|io)$/.test(origin) ||
        origin === 'https://adminmarksorter.webnoxdigital.com' ||
        origin === 'https://apimarksorter.webnoxdigital.com';
      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookieHeader = client.handshake.headers?.cookie || '';
      const cookieToken = cookieHeader
        .split(';')
        .map((c: string) => c.trim())
        .find((c: string) => c.startsWith('access_token='))
        ?.split('=')[1];

      const token =
        cookieToken ||
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id} for user ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    return { event: 'pong', data: 'pong' };
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
