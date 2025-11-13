import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'ID de la conversación destino', example: 'uuid-of-conversation' })
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Contenido del mensaje', example: 'Hola, ¿podemos agendar una visita?' })
  @IsString()
  content: string;
}
