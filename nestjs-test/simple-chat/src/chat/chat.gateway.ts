import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  connectedClients: { [socketId: string]: boolean } = {};
  clientNickName: { [socketId: string]: boolean } = {};
  roomUsers: { [key: string]: boolean } = {};

  handleConnection(client: Socket): void {
    // 이미 연결되어 있는 클라이언트인지 확인합니다.
    if (this.connectedClients[client.id]) {
      client.disconnect(true); // 이미 연결되어 있는 클라이언트는 연결을 종료합니다.
      return;
    }

    this.connectedClients[client.id] = true;
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
