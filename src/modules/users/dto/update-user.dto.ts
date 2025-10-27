import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'URL de la foto de perfil' })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiPropertyOptional({ description: 'ID de Google para OAuth2' })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({ description: 'Indica si el usuario está verificado' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Rol del usuario', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'role debe ser uno de: sin_rol, estudiante, arrendador' })
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Configuración de notificaciones' })
  @IsOptional()
  notificationSettings?: {
    receiveNewRequests: boolean;
    receiveNewMessages: boolean;
    notifyTour360View: boolean;
  };

  @ApiPropertyOptional({ description: 'Preferencias de la aplicación' })
  @IsOptional()
  appPreferences?: {
    language: string;
    timezone: string;
  };
}
