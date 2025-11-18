import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';
import { ChatModule } from '../chat/chat.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation, AiMessage]),
    PropertiesModule,
    UsersModule,
    RequestsModule,
    ChatModule,
    MediaModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
