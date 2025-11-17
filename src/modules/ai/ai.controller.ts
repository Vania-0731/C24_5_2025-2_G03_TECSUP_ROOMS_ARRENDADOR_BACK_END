import { Body, Controller, Post, Req, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { Get, Param, Delete } from '@nestjs/common';
import { Response } from 'express';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat con asistente IA (Gemini) - Streaming' })
  async chat(@Body() dto: ChatRequestDto, @Req() req: any, @Res() res: Response) {
    const userId = req.user?.id || req.user?.sub;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const result = await this.ai.chatStream(dto, userId, (chunk: string, metadata?: any) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk, ...metadata })}\n\n`);
      });
      res.write(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`);
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
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

  @Get('models')
  @ApiOperation({ summary: 'Listar modelos disponibles de Gemini' })
  async listModels(@Req() req: any) {
    return this.ai.listAvailableModels();
  }
}
