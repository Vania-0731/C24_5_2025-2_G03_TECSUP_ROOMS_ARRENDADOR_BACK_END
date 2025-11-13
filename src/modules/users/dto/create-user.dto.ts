import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, Length, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre completo del arrendador' })
  @IsString()
  @Length(2, 255, { message: 'El nombre debe tener entre 2 y 255 caracteres' })
  fullName: string;

  @ApiProperty({ description: 'Email del arrendador (cualquier dominio)' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

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

  @ApiPropertyOptional({ description: 'Rol del usuario', enum: UserRole, default: UserRole.TENANT })
  @IsOptional()
  @IsEnum(UserRole, { message: 'role debe ser uno de: tenant, landlord' })
  role?: UserRole;
}
