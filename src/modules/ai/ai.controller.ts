import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { Get, Param, Delete } from '@nestjs/common';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat con asistente IA (Gemini)' })
  async chat(@Body() dto: ChatRequestDto, @Req() req: any) {
    return this.ai.chat(dto, req.user?.id || req.user?.sub);
    }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar conversaciones del usuario' })
  async listConversations(@Req() req: any) {
    return this.ai.listConversations(req.user?.id || req.user?.sub);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Listar mensajes de una conversación' })
  async listMessages(@Param('id') id: string, @Req() req: any) {
    return this.ai.listMessages(id, (req.user?.id || req.user?.sub));
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Eliminar una conversación' })
  async deleteConversation(@Param('id') id: string, @Req() req: any) {
    return this.ai.deleteConversation(id, (req.user?.id || req.user?.sub));
  }
}
