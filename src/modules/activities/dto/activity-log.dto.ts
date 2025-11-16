import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { EntityType, ActionType } from '../entities/activity-log.entity';

export class ActivityLogDto {
  @ApiPropertyOptional({ description: 'ID del usuario que realizó la acción' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Tipo de entidad afectada', enum: EntityType })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiPropertyOptional({ description: 'ID de la entidad afectada' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Tipo de acción realizada', enum: ActionType })
  @IsEnum(ActionType)
  action: ActionType;

  @ApiPropertyOptional({ description: 'Descripción de la actividad' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Metadatos adicionales' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}



