import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum EntityType {
  PROPERTY = 'property',
  REQUEST = 'request',
  MESSAGE = 'message',
  TOUR360 = 'tour360',
  USER = 'user',
}

export enum ActionType {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  TOUR_VIEW = 'tour_view',
  ACCEPT = 'accept',
  REJECT = 'reject',
}

@Entity('activity_logs')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
export class ActivityLog {
  @ApiProperty({ description: 'ID único del registro de actividad' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID del usuario que realizó la acción', required: false })
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ApiProperty({ description: 'Tipo de entidad afectada', enum: EntityType })
  @Column({ type: 'enum', enum: EntityType })
  entityType: EntityType;

  @ApiProperty({ description: 'ID de la entidad afectada', required: false })
  @Column({ name: 'entity_id', nullable: true })
  entityId?: string;

  @ApiProperty({ description: 'Tipo de acción realizada', enum: ActionType })
  @Column({ type: 'enum', enum: ActionType })
  action: ActionType;

  @ApiProperty({ description: 'Descripción de la actividad', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Metadatos adicionales', required: false })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;
}



