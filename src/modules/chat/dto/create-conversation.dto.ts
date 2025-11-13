import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID del usuario destinatario', example: 'uuid-of-user' })
  @IsString()
  participantId: string;
}
