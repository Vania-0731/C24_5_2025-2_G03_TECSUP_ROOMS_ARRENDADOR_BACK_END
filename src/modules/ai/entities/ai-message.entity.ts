import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AiConversation } from './ai-conversation.entity';

export type AiRole = 'user' | 'model';

@Entity('ai_messages')
export class AiMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AiConversation, (c) => c.messages, { onDelete: 'CASCADE' })
  conversation: AiConversation;

  @Column({ type: 'varchar', length: 10 })
  role: AiRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
