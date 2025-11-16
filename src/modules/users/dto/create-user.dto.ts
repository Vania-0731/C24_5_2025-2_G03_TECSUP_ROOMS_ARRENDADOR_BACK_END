import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, Length, IsBoolean, IsUUID } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre completo del usuario' })
  @IsString()
  @Length(2, 255, { message: 'El nombre debe tener entre 2 y 255 caracteres' })
  fullName: string;

  @ApiProperty({ description: 'Email del usuario (cualquier dominio)' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  @ApiProperty({ description: 'ID del rol del usuario' })
  @IsUUID('4', { message: 'roleId debe ser un UUID válido' })
  roleId: string;

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
}
