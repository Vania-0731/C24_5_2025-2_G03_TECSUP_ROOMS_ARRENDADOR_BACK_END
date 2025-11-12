import { OnGatewayConnection, WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ namespace: '/chat', cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3001', credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private chatService: ChatService, private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token);
      (client as any).userId = payload.sub || payload.id || payload.userId;

      const conversations = await this.chatService.listConversations((client as any).userId);
      conversations.forEach((c) => client.join(this.roomForConversation(c.id)));
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('message:send')
  async onSendMessage(@ConnectedSocket() client: Socket, @MessageBody() body: SendMessageDto) {
    const userId = (client as any).userId as string;
    const msg = await this.chatService.sendMessage(body.conversationId, userId, body.content);
    const room = this.roomForConversation(body.conversationId);
    this.server.to(room).emit('message:new', msg);
    return msg;
  }

  @SubscribeMessage('conversation:typing')
  async onTyping(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; isTyping: boolean }) {
    const userId = (client as any).userId as string;
    const room = this.roomForConversation(body.conversationId);
    // Notificamos a otros participantes
    client.to(room).emit('conversation:typing', { conversationId: body.conversationId, userId, isTyping: body.isTyping });
  }

  @SubscribeMessage('conversation:read')
  async onRead(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    const userId = (client as any).userId as string;
    const result = await this.chatService.markAsRead(body.conversationId, userId);
    const room = this.roomForConversation(body.conversationId);
    // Informar a otros que este usuario leyó
    client.to(room).emit('conversation:read', result);
    return result;
  }

  private extractToken(client: Socket) {
    const auth = client.handshake.auth?.token || client.handshake.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
    if (typeof auth === 'string') return auth;
    throw new Error('Unauthorized');
  }

  private roomForConversation(id: string) {
    return `conversation:${id}`;
  }
}
