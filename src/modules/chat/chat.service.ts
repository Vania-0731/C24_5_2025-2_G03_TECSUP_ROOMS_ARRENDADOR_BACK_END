import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { User } from '../users/entities/user.entity';
import { ActivitiesService } from '../activities/services/activities.service';
import { EntityType, ActionType } from '../activities/entities/activity-log.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private conversationsRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant) private participantsRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private readonly activities: ActivitiesService,
  ) {}

  async createConversation(creatorId: string, dto: CreateConversationDto) {
    if (dto.participantId === creatorId) {
      throw new ForbiddenException('No puedes iniciar conversación contigo mismo');
    }

    const users = await this.usersRepo.find({ where: { id: In([creatorId, dto.participantId]) } });
    if (users.length !== 2) {
      throw new NotFoundException('Usuario destinatario no existe');
    }

    const existing = await this.conversationsRepo
      .createQueryBuilder('c')
      .innerJoin('c.participants', 'p1', 'p1.user = :u1', { u1: creatorId })
      .innerJoin('c.participants', 'p2', 'p2.user = :u2', { u2: dto.participantId })
      .getOne();

    if (existing) {
      return this.findConversationById(existing.id, creatorId);
    }

    const conversation = this.conversationsRepo.create({});
    await this.conversationsRepo.save(conversation);

    const creator = users.find((u) => u.id === creatorId)!;
    const partner = users.find((u) => u.id === dto.participantId)!;
    const participants = [creator, partner].map((u) => this.participantsRepo.create({ conversation, user: u }));
    await this.participantsRepo.save(participants);
    return this.findConversationById(conversation.id, creatorId);
  }

  async findConversationById(id: string, requesterId: string) {
    const conversation = await this.conversationsRepo.findOne({
      where: { id },
      relations: ['participants', 'participants.user'],
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');

    const isParticipant = await this.participantsRepo.exists({ where: { conversation: { id }, user: { id: requesterId } } });
    if (!isParticipant) throw new ForbiddenException('No perteneces a esta conversación');
    return conversation;
  }

  async listConversations(userId: string) {
    const parts = await this.participantsRepo.find({ where: { user: { id: userId } }, relations: ['conversation'] });
    const ids = parts.map((p) => p.conversation.id);
    if (!ids.length) return [];
    const conversations = await this.conversationsRepo.find({ where: { id: In(ids) }, relations: ['participants', 'participants.user'] });

    const results = [] as any[];
    for (const c of conversations) {
      const lastMessage = await this.messagesRepo.findOne({ where: { conversation: { id: c.id } }, order: { createdAt: 'DESC' } });
      const participant = parts.find((p) => p.conversation.id === c.id)!;
      let lastReadAt: Date;
      if (participant.lastReadAt) {
        lastReadAt = participant.lastReadAt instanceof Date ? participant.lastReadAt : new Date(participant.lastReadAt);
      } else {
        lastReadAt = new Date(0);
      }
      const qb = this.messagesRepo.createQueryBuilder('m')
        .where('m.conversationId = :cid', { cid: c.id })
        .andWhere('m.createdAt > :lra', { lra: lastReadAt })
        .andWhere('m.senderId != :uid', { uid: userId });
      const unread = await qb.getCount();

      results.push({ ...c, lastMessage, unreadCount: unread, lastMessageAt: lastMessage?.createdAt || c.createdAt });
    }
    results.sort((a, b) => (b.lastMessageAt?.getTime?.() || 0) - (a.lastMessageAt?.getTime?.() || 0));
    return results;
  }

  async listMessages(conversationId: string, userId: string, limit = 30, before?: string) {
    await this.ensureParticipant(conversationId, userId);
    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .where('m.conversationId = :cid', { cid: conversationId })
      .orderBy('m.createdAt', 'DESC')
      .limit(limit);
    if (before) qb.andWhere('m.createdAt < :before', { before: new Date(before) });
    const rows = await qb.getMany();
    return rows.reverse();
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    await this.ensureParticipant(conversationId, senderId);
    const message = this.messagesRepo.create({
      content,
      conversation: { id: conversationId } as Conversation,
      sender: { id: senderId } as User,
    });
    const saved = await this.messagesRepo.save(message);
    try {
      await this.activities.logActivity(
        senderId,
        EntityType.MESSAGE,
        ActionType.CREATE,
        saved.id,
        'Usuario envió un mensaje',
        { conversationId },
      );
    } catch (_) {}
    return saved;
  }

  private async ensureParticipant(conversationId: string, userId: string) {
    const exists = await this.participantsRepo.exists({ where: { conversation: { id: conversationId }, user: { id: userId } } });
    if (!exists) throw new ForbiddenException('No perteneces a esta conversación');
  }

  async markAsRead(conversationId: string, userId: string) {
    const part = await this.participantsRepo.findOne({ where: { conversation: { id: conversationId }, user: { id: userId } } });
    if (!part) throw new ForbiddenException('No perteneces a esta conversación');
    part.lastReadAt = new Date();
    await this.participantsRepo.save(part);
    return { conversationId, userId, lastReadAt: part.lastReadAt };
  }
}
