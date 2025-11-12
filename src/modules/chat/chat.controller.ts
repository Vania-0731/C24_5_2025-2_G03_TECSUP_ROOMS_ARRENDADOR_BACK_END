import { Controller, Get, Post, Body, Param, Req, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversaciones del usuario autenticado' })
  @ApiOkResponse({
    description: 'Listado de conversaciones con último mensaje y no leídos',
    schema: {
      example: [
        {
          id: 'c3f9b6b6-9a2a-4a62-9f30-9d2b0a1d1f00',
          participants: [
            { id: 'u1', fullName: 'Ana López', profilePicture: null },
            { id: 'u2', fullName: 'Carlos Mendoza', profilePicture: null }
          ],
          lastMessage: {
            id: 'm10',
            content: '¿Podríamos agendar una visita?',
            createdAt: '2025-11-10T15:30:00.000Z',
            senderId: 'u1'
          },
          lastMessageAt: '2025-11-10T15:30:00.000Z',
          unreadCount: 2,
          createdAt: '2025-11-10T14:00:00.000Z',
          updatedAt: '2025-11-10T15:30:01.000Z'
        }
      ]
    }
  })
  listConversations(@Req() req: any) {
    return this.chatService.listConversations(req.user.sub || req.user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Crear o reutilizar conversación 1 a 1 con un destinatario' })
  @ApiOkResponse({
    description: 'Conversación creada o existente',
    schema: {
      example: {
        id: 'c3f9b6b6-9a2a-4a62-9f30-9d2b0a1d1f00',
        participants: [
          { id: 'uMe', fullName: 'Yo', profilePicture: null },
          { id: 'uOther', fullName: 'Ana López', profilePicture: null }
        ],
        createdAt: '2025-11-10T14:00:00.000Z',
        updatedAt: '2025-11-10T14:00:00.000Z'
      }
    }
  })
  createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(req.user.sub || req.user.id, dto);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Listar mensajes de una conversación (paginado)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de mensajes (máx 100). Por defecto 30.' })
  @ApiQuery({ name: 'before', required: false, description: 'Cursor temporal ISO para paginar hacia atrás' })
  @ApiOkResponse({
    description: 'Listado de mensajes',
    schema: {
      example: [
        {
          id: 'm1',
          content: 'Hola, ¿podemos agendar una visita?',
          createdAt: '2025-11-10T15:30:00.000Z',
          sender: { id: 'uOther', fullName: 'Ana López', profilePicture: null }
        },
        {
          id: 'm2',
          content: 'Claro, ¿te parece mañana 9am?',
          createdAt: '2025-11-10T15:31:00.000Z',
          sender: { id: 'uMe', fullName: 'Yo', profilePicture: null }
        }
      ]
    }
  })
  listMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const l = limit ? Math.min(parseInt(limit, 10) || 30, 100) : 30;
    return this.chatService.listMessages(id, req.user.sub || req.user.id, l, before);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Marcar como leído todos los mensajes visibles en la conversación' })
  @ApiOkResponse({
    description: 'Resultado de marcado como leído',
    schema: {
      example: {
        conversationId: 'c3f9b6b6-9a2a-4a62-9f30-9d2b0a1d1f00',
        userId: 'uMe',
        lastReadAt: '2025-11-10T15:32:00.000Z'
      }
    }
  })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.chatService.markAsRead(id, req.user.sub || req.user.id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Enviar mensaje por REST (alternativa a WebSocket)' })
  @ApiOkResponse({
    description: 'Mensaje creado',
    schema: {
      example: {
        id: 'm100',
        content: 'Nos vemos mañana a las 9am',
        createdAt: '2025-11-10T15:35:00.000Z',
        conversation: { id: 'c3f9b6b6-9a2a-4a62-9f30-9d2b0a1d1f00' },
        sender: { id: 'uMe', fullName: 'Yo', profilePicture: null }
      }
    }
  })
  sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto.conversationId, req.user.sub || req.user.id, dto.content);
  }
}
