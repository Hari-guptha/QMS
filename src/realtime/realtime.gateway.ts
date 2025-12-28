import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/queue',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('RealtimeGateway');
  private activeAgents = new Set<string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-agent-room')
  handleJoinAgentRoom(client: Socket, agentId: string) {
    client.join(`agent:${agentId}`);
    this.logger.log(`Client ${client.id} joined agent room: ${agentId}`);
  }

  @SubscribeMessage('join-category-room')
  handleJoinCategoryRoom(client: Socket, categoryId: string) {
    client.join(`category:${categoryId}`);
    this.logger.log(`Client ${client.id} joined category room: ${categoryId}`);
  }

  @SubscribeMessage('join-public-room')
  handleJoinPublicRoom(client: Socket) {
    client.join('public');
    this.logger.log(`Client ${client.id} joined public room`);
  }
}

