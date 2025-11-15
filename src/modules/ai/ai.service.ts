import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ChatRequestDto } from './dto/chat-request.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiConversation) private readonly convRepo: Repository<AiConversation>,
    @InjectRepository(AiMessage) private readonly msgRepo: Repository<AiMessage>,
  ) {}

  private get apiKey() {
    const key = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) throw new UnauthorizedException('Falta GOOGLE_GEMINI_API_KEY');
    return key;
  }

  async chat(dto: ChatRequestDto, userId?: string) {
    // Modelo definido en el backend
    const modelName = 'gemini-1.5-flash';
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // 1) Resolver conversación (crear si no existe)
    let conversation: AiConversation | null = null;
    if (dto.conversationId) {
      conversation = await this.convRepo.findOne({ where: { id: dto.conversationId } });
      if (!conversation) throw new NotFoundException('Conversación no encontrada');
      if (conversation.userId !== userId) throw new ForbiddenException('No puedes usar esta conversación');
    } else {
      conversation = this.convRepo.create({ userId: userId!, title: dto.title?.trim() || 'Asistente IA' });
      conversation = await this.convRepo.save(conversation);
    }

    // 2) Construir contexto con historial previo + último mensaje del usuario
    const prev = await this.msgRepo.find({ where: { conversation: { id: conversation.id } }, order: { createdAt: 'ASC' } });
    const contents = [] as any[];
    const systemPrompt = process.env.AI_SYSTEM_PROMPT ||
      'Eres un asistente inmobiliario para arrendadores. Responde en español, con tono profesional y útil. '
      + 'Da recomendaciones prácticas y accionables. Cuando convenga, usa listas y pasos claros. '
      + 'Si la pregunta no es del dominio inmobiliario, responde brevemente y redirígela al contexto adecuado. '
      + 'Sé conciso y evita información irrelevante.';
    contents.push({ role: 'user', parts: [{ text: `Sistema: ${systemPrompt}` }] });
    for (const m of prev) {
      contents.push({ role: m.role, parts: [{ text: m.content }] });
    }
    const lastIncoming = dto.messages[dto.messages.length - 1];
    const incomingRole = lastIncoming?.role === 'model' ? 'model' : 'user';
    const incomingContent = lastIncoming?.content || '';
    if (incomingContent) {
      contents.push({ role: incomingRole, parts: [{ text: incomingContent }] });
    }

    try {
      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response?.text?.() || '';

      // 3) Persistir mensajes (usuario y asistente)
      if (incomingContent) {
        const userMsg = this.msgRepo.create({ conversation: { id: conversation.id } as AiConversation, role: 'user', content: incomingContent });
        await this.msgRepo.save(userMsg);
      }
      const modelMsg = this.msgRepo.create({ conversation: { id: conversation.id } as AiConversation, role: 'model', content: text });
      await this.msgRepo.save(modelMsg);

      return {
        answer: text || '',
        raw: result, // contiene response y metadata
        model: modelName,
        userId,
        conversationId: conversation.id,
      };
    } catch (e) {
      if (e instanceof InternalServerErrorException || e instanceof UnauthorizedException) throw e;
      throw new InternalServerErrorException((e as Error)?.message || 'Error llamando a Gemini');
    }
  }

  async listConversations(userId: string) {
    const convs = await this.convRepo.find({ where: { userId }, order: { updatedAt: 'DESC' } });
    return convs;
  }

  async listMessages(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversación no encontrada');
    if (conv.userId !== userId) throw new ForbiddenException('No puedes acceder a esta conversación');
    const messages = await this.msgRepo.find({ where: { conversation: { id: conversationId } }, order: { createdAt: 'ASC' } });
    return { conversation: conv, messages };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversación no encontrada');
    if (conv.userId !== userId) throw new ForbiddenException('No puedes eliminar esta conversación');
    await this.convRepo.remove(conv);
    return { message: 'Conversación eliminada' };
  }
}
