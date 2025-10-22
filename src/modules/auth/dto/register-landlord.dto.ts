import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsNumber, Min, Max, Length, Matches } from 'class-validator';

export class RegisterLandlordDto {
  @ApiProperty({ 
    description: 'Nombre completo del arrendador',
    example: 'María González Pérez'
  })
  @IsString()
  @Length(2, 255, { message: 'El nombre debe tener entre 2 y 255 caracteres' })
  fullName: string;

  @ApiProperty({ 
    description: 'Email del arrendador (cualquier dominio)',
    example: 'maria.gonzalez@gmail.com'
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  @ApiProperty({ 
    description: 'Número de teléfono (9 dígitos)',
    example: '987654321'
  })
  @IsString()
  @Matches(/^[0-9]{9}$/, { message: 'El teléfono debe tener exactamente 9 dígitos' })
  phone: string;

  @ApiProperty({ 
    description: 'DNI (8 dígitos)',
    example: '12345678'
  })
  @IsString()
  @Matches(/^[0-9]{8}$/, { message: 'El DNI debe tener exactamente 8 dígitos' })
  dni: string;

  @ApiProperty({ 
    description: 'Dirección completa del arrendador',
    example: 'Av. Arequipa 1234, Lima, Perú'
  })
  @IsString()
  @Length(10, 500, { message: 'La dirección debe tener entre 10 y 500 caracteres' })
  address: string;

  @ApiPropertyOptional({ 
    description: 'Número de propiedades que posee', 
    default: 0,
    example: 2
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El número de propiedades no puede ser negativo' })
  @Max(999, { message: 'El número de propiedades no puede ser mayor a 999' })
  propertiesCount?: number;

  @ApiPropertyOptional({ 
    description: 'URL de la foto de perfil',
    example: 'https://lh3.googleusercontent.com/a/example'
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
