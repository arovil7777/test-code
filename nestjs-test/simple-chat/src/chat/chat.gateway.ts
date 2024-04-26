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

  connectedClients: Set<string> = new Set();
  clientNickName: Map<string, string> = new Map();
  roomUsers: Map<string, string[]> = new Map();
  maxRoomUsers: Map<string, number> = new Map();

  handleConnection(client: Socket): void {
    // 이미 연결되어 있는 클라이언트인지 확인합니다.
    if (this.connectedClients.has(client.id)) {
      client.disconnect(true); // 이미 연결되어 있는 클라이언트는 연결을 종료합니다.
      return;
    }

    this.connectedClients.add(client.id);
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);

    // 클라이언트 연결이 종료되면 해당 클라이언트가 속한 모든 방에서 유저를 제거합니다.
    this.roomUsers.forEach((userList, room) => {
      const index = userList?.indexOf(this.clientNickName.get(client.id));
      if (index !== -1) {
        userList.splice(index, 1);
        this.server.to(room).emit('userLeft', {
          userId: this.clientNickName.get(client.id),
          room,
        });
        this.server.to(room).emit('userList', { room, userList });
      }
    });

    // 모든 방의 유저 목록을 업데이트하여 emit합니다.
    this.roomUsers.forEach((userList, room) => {
      this.server.to(room).emit('userList', { room, userList });
    });

    // 연결된 클라이언트 목록을 업데이트하여 emit합니다.
    this.server.emit('userList', {
      room: null,
      userList: Array.from(this.connectedClients),
    });
  }

  @SubscribeMessage('setUserNick')
  handleSetUserNick(client: Socket, nick: string): void {
    this.clientNickName.set(client.id, nick);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, room: string): void {
    // 이미 접속 중인 방인지 확인합니다.
    if (client.rooms.has(room)) {
      return;
    }

    // 방에 대한 최대 인원을 확인합니다.
    const maxUsers = this.maxRoomUsers.get(room) || 5; // 기본값으로 방의 최대 인원을 5명으로 설정합니다.

    // 방의 현재 유저 수를 확인합니다.
    const currentUsers = this.roomUsers.get(room)?.length || 0;

    // 방에 대한 최대 인원을 확인하고, 만약 인원이 가득찼다면 새로운 방을 생성합니다.
    if (currentUsers >= maxUsers) {
      const newRoom = this.createRoom();
      client.join(newRoom);

      if (!this.roomUsers.has(newRoom)) {
        this.roomUsers.set(newRoom, []);
      }

      this.roomUsers.get(newRoom).push(this.clientNickName.get(client.id));
      this.server.to(newRoom).emit('userJoined', {
        userId: this.clientNickName.get(client.id),
        room: newRoom,
      });
      this.server.to(newRoom).emit('userList', {
        room: newRoom,
        userList: this.roomUsers.get(newRoom),
      });

      this.server.emit('userList', {
        room: null,
        userList: Array.from(this.connectedClients),
      });
      return;
    }

    client.join(room);

    if (!this.roomUsers.has(room)) {
      this.roomUsers.set(room, []);
    }

    this.roomUsers.get(room).push(this.clientNickName.get(client.id));
    this.server
      .to(room)
      .emit('userJoined', { userId: this.clientNickName.get(client.id), room });
    this.server
      .to(room)
      .emit('userList', { room, userList: this.roomUsers.get(room) });

    this.server.emit('userList', {
      room: null,
      userList: Array.from(this.connectedClients),
    });
  }

  createRoom(): string {
    return `room-${Date.now()}`;
  }

  @SubscribeMessage('exit')
  handleExit(client: Socket, room: string): void {
    // 방에 접속되어 있는 상태가 아니라면 return합니다.
    if (!client.rooms.has(room)) {
      return;
    }
    client.leave(room);

    const userList = this.roomUsers.get(room);
    const index = userList?.indexOf(this.clientNickName.get(client.id));
    if (index !== -1) {
      userList.splice(index, 1);
      this.server
        .to(room)
        .emit('userLeft', { userId: this.clientNickName.get(client.id), room });
      this.server.to(room).emit('userList', { room, userList });
    }

    // 모든 방의 유저 목록을 업데이트하여 emit합니다.
    this.roomUsers.forEach((userList, room) => {
      this.server.to(room).emit('userList', { room, userList });
    });

    // 연결된 클라이언트 목록을 업데이트하여 emit합니다.
    this.server.emit('userList', {
      room: null,
      userList: Array.from(this.connectedClients),
    });
  }

  @SubscribeMessage('getUserList')
  handleGetUserList(room: string): void {
    this.server
      .to(room)
      .emit('userList', { room, userList: this.roomUsers.get(room) });
  }

  @SubscribeMessage('chatMessage')
  handleChatMessage(
    client: Socket,
    data: { message: string; room: string },
  ): void {
    // 클라이언트가 보낸 채팅 메시지를 해당 방으로 전달합니다.
    this.server.to(data.room).emit('chatMessage', {
      userId: this.clientNickName.get(client.id),
      message: data.message,
      room: data.room,
    });
  }
}
