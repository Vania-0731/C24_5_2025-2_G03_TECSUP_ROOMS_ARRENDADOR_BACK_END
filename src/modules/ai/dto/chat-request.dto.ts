import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMessageDto } from './chat-message.dto';

export class ChatRequestDto {
  @ApiPropertyOptional({ description: 'ID de la conversación existente. Si no se envía, se crea una nueva.' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Título para la conversación (solo al crear).' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: [ChatMessageDto], description: 'Historial de mensajes' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}
