import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ChatRequestDto } from './dto/chat-request.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
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

    const contents = [] as any[];
    const systemPrompt = process.env.AI_SYSTEM_PROMPT ||
      'Eres un asistente inmobiliario para arrendadores. Responde en español, con tono profesional y útil. '
      + 'Da recomendaciones prácticas y accionables. Cuando convenga, usa listas y pasos claros. '
      + 'Si la pregunta no es del dominio inmobiliario, responde brevemente y redirígela al contexto adecuado. '
      + 'Sé conciso y evita información irrelevante.';
    contents.push({ role: 'user', parts: [{ text: `Sistema: ${systemPrompt}` }] });
    for (const m of dto.messages) {
      const role = m.role === 'model' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: m.content }] });
    }

    try {
      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response?.text?.() || '';

      return {
        answer: text || '',
        raw: result, // contiene response y metadata
        model: modelName,
        userId,
      };
    } catch (e) {
      if (e instanceof InternalServerErrorException || e instanceof UnauthorizedException) throw e;
      throw new InternalServerErrorException((e as Error)?.message || 'Error llamando a Gemini');
    }
  }
}
