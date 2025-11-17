import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ChatRequestDto } from './dto/chat-request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { PropertiesService } from '../properties/services/properties.service';
import { UsersService } from '../users/services/users.service';
import { RequestsService } from '../requests/services/requests.service';
import { SYSTEM_PROMPT } from './prompts/system.prompt';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiConversation) private readonly convRepo: Repository<AiConversation>,
    @InjectRepository(AiMessage) private readonly msgRepo: Repository<AiMessage>,
    private readonly propertiesService: PropertiesService,
    private readonly usersService: UsersService,
    private readonly requestsService: RequestsService,
  ) {}

  private get apiKey() {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) throw new UnauthorizedException('Falta GOOGLE_API_KEY o GEMINI_API_KEY en las variables de entorno');
    return key;
  }

  private async buildUserContext(userId: string): Promise<string> {
    try {
      const [user, stats, properties, requests] = await Promise.all([
        this.usersService.getProfile(userId).catch(() => null),
        this.propertiesService.getStats(userId).catch(() => null),
        this.propertiesService.findAllByLandlord(userId).catch(() => []),
        this.requestsService.listForLandlord(userId).catch(() => []),
      ]);

      const contextParts: string[] = [];

      if (user) {
        contextParts.push(`Usuario: ${user.fullName || user.email}`);
        if (user.role) {
          const roleName = typeof user.role === 'object' ? user.role.name : user.role;
          contextParts.push(`Rol: ${roleName}`);
        }
      }

      if (stats) {
        contextParts.push(`\nEstadísticas del usuario:`);
        contextParts.push(`- Total de propiedades: ${stats.totalProperties}`);
        contextParts.push(`- Propiedades disponibles: ${stats.availableProperties}`);
        contextParts.push(`- Propiedades alquiladas: ${stats.rentedProperties}`);
        contextParts.push(`- Total de visualizaciones: ${stats.totalViews}`);
        contextParts.push(`- Total de tours 360°: ${stats.totalTours}`);
      }

      if (properties && properties.length > 0) {
        contextParts.push(`\nPropiedades del usuario (${properties.length}):`);
        properties.slice(0, 5).forEach((prop: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${prop.title || 'Sin título'} - Estado: ${prop.status || 'N/A'} - Precio: S/.${prop.price || 'N/A'}`);
        });
        if (properties.length > 5) {
          contextParts.push(`... y ${properties.length - 5} propiedades más`);
        }
      }

      if (requests && requests.length > 0) {
        const pending = requests.filter((r: any) => r.status === 'pending').length;
        const accepted = requests.filter((r: any) => r.status === 'accepted').length;
        const rejected = requests.filter((r: any) => r.status === 'rejected').length;
        contextParts.push(`\nSolicitudes:`);
        contextParts.push(`- Pendientes: ${pending}`);
        contextParts.push(`- Aceptadas: ${accepted}`);
        contextParts.push(`- Rechazadas: ${rejected}`);
      }

      return contextParts.join('\n');
    } catch {
      return 'Información del usuario no disponible en este momento.';
    }
  }

  async listAvailableModels() {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`);
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      return [];
    }
  }

  private async sendTextWordByWord(
    text: string,
    onChunk: (chunk: string, metadata?: any) => void,
    conversationId: string,
    delayMs: number = 30
  ): Promise<void> {
    if (!text || text.trim().length === 0) return;
    
    const words = text.split(/(\s+)/);
    for (const word of words) {
      if (word.trim().length > 0 || word === ' ') {
        onChunk(word, { conversationId });
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  private async generateConversationTitle(firstMessage: string): Promise<string> {
    if (!firstMessage || firstMessage.trim().length === 0) {
      return 'Nueva conversación';
    }

    try {
      const titlePrompt = `Genera un título corto (máximo 50 caracteres) para esta conversación basado en el siguiente mensaje del usuario. El título debe ser descriptivo y en español. Solo responde con el título, sin explicaciones adicionales.\n\nMensaje: "${firstMessage.substring(0, 200)}"`;
      
      const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${this.apiKey}`;
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: titlePrompt }] }],
        }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (title) {
          const cleanTitle = title.replace(/^["']|["']$/g, '').replace(/\n/g, ' ').substring(0, 50).trim();
          return cleanTitle || 'Nueva conversación';
        }
      }
    } catch (error) {
    }
    
    const fallbackTitle = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...' 
      : firstMessage;
    return fallbackTitle || 'Nueva conversación';
  }

  async chatStream(
    dto: ChatRequestDto,
    userId: string,
    onChunk: (chunk: string, metadata?: any) => void
  ) {
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
    
    let conversation: AiConversation | null = null;
    
    if (dto.conversationId) {
      conversation = await this.convRepo.findOne({ where: { id: dto.conversationId } });
      if (!conversation) throw new NotFoundException('Conversación no encontrada');
      if (conversation.userId !== userId) throw new ForbiddenException('No puedes usar esta conversación');
    } else {
      const firstMessage = dto.messages?.[0]?.content || '';
      const autoTitle = firstMessage ? await this.generateConversationTitle(firstMessage) : 'Nueva conversación';
      conversation = this.convRepo.create({ 
        userId: userId!, 
        title: dto.title?.trim() || autoTitle 
      });
      conversation = await this.convRepo.save(conversation);
      
      onChunk('', { type: 'conversation_created', conversationId: conversation.id, title: conversation.title });
    }

    const prev = await this.msgRepo.find({ where: { conversation: { id: conversation.id } }, order: { createdAt: 'ASC' } });
    const userContext = await this.buildUserContext(userId);

    const contents = [] as any[];
    const baseSystemPrompt = process.env.AI_SYSTEM_PROMPT || SYSTEM_PROMPT;
    const systemPrompt = `${baseSystemPrompt}\n\nCONTEXTO ACTUAL DEL USUARIO:\n${userContext}\n\n---\n\nUsa esta información para dar respuestas personalizadas y relevantes.`;

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
      if (incomingContent) {
        const userMsg = this.msgRepo.create({ conversation: { id: conversation.id } as AiConversation, role: 'user', content: incomingContent });
        await this.msgRepo.save(userMsg);
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:streamGenerateContent?key=${this.apiKey}`;
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new InternalServerErrorException(
          errorData.error?.message || `Error de API: ${apiResponse.status} ${apiResponse.statusText}`
        );
      }

      let fullText = '';
      const reader = apiResponse.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });          
          let processed = false;
          while (buffer.length > 0 && !processed) {
            if (buffer.trim().startsWith('[')) {
              try {
                let endIndex = -1;
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                for (let i = 0; i < buffer.length; i++) {
                  if (escapeNext) {
                    escapeNext = false;
                    continue;
                  }
                  if (buffer[i] === '\\') {
                    escapeNext = true;
                    continue;
                  }
                  if (buffer[i] === '"') {
                    inString = !inString;
                    continue;
                  }
                  if (inString) continue;
                  
                  if (buffer[i] === '[') depth++;
                  if (buffer[i] === ']') {
                    depth--;
                    if (depth === 0) {
                      endIndex = i + 1;
                      break;
                    }
                  }
                }
                if (endIndex > 0) {
                  const jsonStr = buffer.substring(0, endIndex);
                  const jsonArray = JSON.parse(jsonStr);
                  buffer = buffer.substring(endIndex);
                  for (const item of jsonArray) {
                    if (item && item.candidates && item.candidates.length > 0) {
                      const candidate = item.candidates[0];
                      if (candidate.content) {
                        if (candidate.content.parts && candidate.content.parts.length > 0) {
                          for (const part of candidate.content.parts) {
                            if (part.text) {
                              fullText += part.text;
                              await this.sendTextWordByWord(part.text, onChunk, conversation.id);
                            }
                          }
                        } else if (candidate.content.text) {
                          fullText += candidate.content.text;
                          await this.sendTextWordByWord(candidate.content.text, onChunk, conversation.id);
                        }
                      }
                    } else if (item && item.error) {
                      throw new InternalServerErrorException(item.error.message || 'Error de Gemini API');
                    }
                  }
                  processed = true;
                } else {
                  break;
                }
              } catch (e) {
                if (buffer.length > 50000) {
                  buffer = '';
                  break;
                }
                break;
              }
            } else {
              const lines = buffer.split('\n');
              if (lines.length > 1) {
                buffer = lines.pop() || '';
                for (const line of lines) {
                  if (!line.trim()) continue;
                  try {
                    let cleanLine = line.trim();
                    if (cleanLine.startsWith('data: ')) {
                      cleanLine = cleanLine.slice(6);
                    }
                    if (!cleanLine) continue;
                    const jsonData = JSON.parse(cleanLine);
                    if (jsonData && jsonData.candidates && jsonData.candidates.length > 0) {
                      const candidate = jsonData.candidates[0];
                      if (candidate.content) {
                        if (candidate.content.parts && candidate.content.parts.length > 0) {
                          for (const part of candidate.content.parts) {
                            if (part.text) {
                              fullText += part.text;
                              await this.sendTextWordByWord(part.text, onChunk, conversation.id);
                            }
                          }
                        } else if (candidate.content.text) {
                          fullText += candidate.content.text;
                          await this.sendTextWordByWord(candidate.content.text, onChunk, conversation.id);
                        }
                      }
                    } else if (jsonData && jsonData.error) {
                      throw new InternalServerErrorException(jsonData.error.message || 'Error de Gemini API');
                    }
                    processed = true;
                  } catch (e) {
                    continue;
                  }
                }
              } else {
                break;
              }
            }
          }
        }
        if (buffer.trim()) {
          try {
            const jsonData = JSON.parse(buffer.trim());
            if (jsonData && jsonData.candidates && jsonData.candidates.length > 0) {
              const candidate = jsonData.candidates[0];
              if (candidate.content) {
                if (candidate.content.parts && candidate.content.parts.length > 0) {
                  for (const part of candidate.content.parts) {
                    if (part.text) {
                      fullText += part.text;
                      await this.sendTextWordByWord(part.text, onChunk, conversation.id);
                    }
                  }
                }
              }
            }
          } catch (e) {
          }
        }
      }
      if (fullText.length === 0) {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${this.apiKey}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          fullText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (fullText) {
            await this.sendTextWordByWord(fullText, onChunk, conversation.id);
          }
        }
      }

      const modelMsg = this.msgRepo.create({ conversation: { id: conversation.id } as AiConversation, role: 'model', content: fullText });
      await this.msgRepo.save(modelMsg);

      return {
        answer: fullText || '',
        model: modelName,
        userId,
        conversationId: conversation.id,
      };
    } catch (e) {
      if (e instanceof InternalServerErrorException || e instanceof UnauthorizedException) throw e;
      throw new InternalServerErrorException((e as Error)?.message || 'Error llamando a Gemini');
    }
  }

  async chat(dto: ChatRequestDto, userId?: string) {
    if (!userId) throw new UnauthorizedException('Usuario no autenticado');
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
    
    let conversation: AiConversation | null = null;
    
    if (dto.conversationId) {
      conversation = await this.convRepo.findOne({ where: { id: dto.conversationId } });
      if (!conversation) throw new NotFoundException('Conversación no encontrada');
      if (conversation.userId !== userId) throw new ForbiddenException('No puedes usar esta conversación');
    } else {
      const firstMessage = dto.messages?.[0]?.content || '';
      const autoTitle = firstMessage ? await this.generateConversationTitle(firstMessage) : 'Nueva conversación';
      conversation = this.convRepo.create({ 
        userId: userId!, 
        title: dto.title?.trim() || autoTitle 
      });
      conversation = await this.convRepo.save(conversation);
    }

    const prev = await this.msgRepo.find({ where: { conversation: { id: conversation.id } }, order: { createdAt: 'ASC' } });
    const userContext = await this.buildUserContext(userId);

    const contents = [] as any[];
    const baseSystemPrompt = process.env.AI_SYSTEM_PROMPT || SYSTEM_PROMPT;
    const systemPrompt = `${baseSystemPrompt}\n\nCONTEXTO ACTUAL DEL USUARIO:\n${userContext}\n\n---\n\nUsa esta información para dar respuestas personalizadas y relevantes.`;

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
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${this.apiKey}`;
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new InternalServerErrorException(
          errorData.error?.message || `Error de API: ${apiResponse.status} ${apiResponse.statusText}`
        );
      }

      const apiData = await apiResponse.json();
      const text = apiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (incomingContent) {
        const userMsg = this.msgRepo.create({ conversation: { id: conversation.id } as AiConversation, role: 'user', content: incomingContent });
        await this.msgRepo.save(userMsg);
      }
      const modelMsg = this.msgRepo.create({ conversation: { id: conversation.id } as AiConversation, role: 'model', content: text });
      await this.msgRepo.save(modelMsg);

      return {
        answer: text || '',
        raw: apiData,
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
