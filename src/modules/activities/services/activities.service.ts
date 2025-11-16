import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ActivityLog, EntityType, ActionType } from '../entities/activity-log.entity';
import { ActivityLogDto } from '../dto/activity-log.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityRepository: Repository<ActivityLog>,
  ) {}

  async create(dto: ActivityLogDto): Promise<ActivityLog> {
    const activity = this.activityRepository.create(dto);
    return await this.activityRepository.save(activity);
  }

  async logActivity(
    userId: string | undefined,
    entityType: EntityType,
    action: ActionType,
    entityId?: string,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<ActivityLog> {
    return this.create({
      userId,
      entityType,
      entityId,
      action,
      description,
      metadata,
    });
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findByUser(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByEntity(entityType: EntityType, entityId: string): Promise<ActivityLog[]> {
    return await this.activityRepository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRecentActivity(userId: string, days: number = 7): Promise<ActivityLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.activityRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, new Date()),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getPropertyViews(propertyId: string, days: number = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.activityRepository.count({
      where: {
        entityType: EntityType.PROPERTY,
        entityId: propertyId,
        action: ActionType.VIEW,
        createdAt: Between(startDate, new Date()),
      },
    });
  }

  async getTour360Views(propertyId: string, days: number = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.activityRepository.count({
      where: {
        entityType: EntityType.TOUR360,
        entityId: propertyId,
        action: ActionType.TOUR_VIEW,
        createdAt: Between(startDate, new Date()),
      },
    });
  }
}



