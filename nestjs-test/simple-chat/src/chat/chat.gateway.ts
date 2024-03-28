import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  connectedClients: { [socketId: string]: boolean } = {};
  clientNickName: { [socketId: string]: string } = {};
  roomUsers: { [key: string]: string[] } = {};

  handleConnection(client: Socket): void {
    // 이미 연결되어 있는 클라이언트인지 확인합니다.
    if (this.connectedClients[client.id]) {
      client.disconnect(true); // 이미 연결되어 있는 클라이언트는 연결을 종료합니다.
      return;
    }

    this.connectedClients[client.id] = true;
  }

  handleDisconnect(client: Socket): void {
    delete this.connectedClients[client.id];

    // 클라이언트 연결이 종료되면 해당 클라이언트가 속한 모든 방에서 유저를 제거합니다.
    Object.keys(this.roomUsers).forEach((room) => {
      const index = this.roomUsers[room]?.indexOf(
        this.clientNickName[client.id],
      );

      if (index !== -1) {
        this.roomUsers[room].splice(index, 1);
        this.server
          .to(room)
          .emit('userLeft', { userId: this.clientNickName[client.id], room });
        this.server
          .to(room)
          .emit('userList', { room, userList: this.roomUsers[room] });
      }
    });

    // 모든 방의 유저 목록을 업데이트하여 emit합니다.
    Object.keys(this.roomUsers).forEach((room) => {
      this.server
        .to(room)
        .emit('userList', { room, userList: this.roomUsers[room] });
    });

    // 연결된 클라이언트 목록을 업데이트하여 emit합니다.
    this.server.emit('userList', {
      room: null,
      userList: Object.keys(this.connectedClients),
    });
  }

  @SubscribeMessage('setUserNick')
  handleSetUserNick(client: Socket, nick: string): void {
    this.clientNickName[client.id] = nick;
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, room: string): void {
    // 이미 접속 중인 방인지 확인합니다.
    if (client.rooms.has(room)) {
      return;
    }

    client.join(room);

    if (!this.roomUsers[room]) {
      this.roomUsers[room] = [];
    }

    this.roomUsers[room].push(this.clientNickName[client.id]);
    this.server
      .to(room)
      .emit('userJoined', { userId: this.clientNickName[client.id], room });
    this.server
      .to(room)
      .emit('userList', { room, userList: this.roomUsers[room] });

    this.server.emit('userList', {
      room: null,
      userList: Object.keys(this.connectedClients),
    });
  }

  @SubscribeMessage('exit')
  handleExit(client: Socket, room: string): void {
    // 방에 접속되어 있는 상태가 아니라면 return합니다.
    if (!client.rooms.has(room)) {
      return;
    }

    client.leave(room);

    const index = this.roomUsers[room]?.indexOf(this.clientNickName[client.id]);
    if (index !== -1) {
      this.roomUsers[room].splice(index, 1);
      this.server
        .to(room)
        .emit('userLeft', { userId: this.clientNickName[client.id], room });
      this.server
        .to(room)
        .emit('userList', { room, userList: this.roomUsers[room] });
    }

    // 모든 방의 유저 목록을 업데이트하여 emit합니다.
    Object.keys(this.roomUsers).forEach((room) => {
      this.server
        .to(room)
        .emit('userList', { room, userList: this.roomUsers[room] });
    });

    // 연결된 클라이언트 목록을 업데이트하여 emit합니다.
    this.server.emit('userList', {
      room: null,
      userList: Object.keys(this.connectedClients),
    });
  }
}
