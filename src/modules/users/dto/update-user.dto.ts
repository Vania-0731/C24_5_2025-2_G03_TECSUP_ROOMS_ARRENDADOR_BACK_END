import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Foto de perfil en base64 (o null para eliminar)' })
  @IsOptional()
  @IsString()
  profilePicture?: string | null;

  @ApiPropertyOptional({ description: 'ID de Google para OAuth2' })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({ description: 'Indica si el usuario está verificado' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'ID del rol del usuario' })
  @IsOptional()
  @IsUUID('4', { message: 'roleId debe ser un UUID válido' })
  roleId?: string;

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
