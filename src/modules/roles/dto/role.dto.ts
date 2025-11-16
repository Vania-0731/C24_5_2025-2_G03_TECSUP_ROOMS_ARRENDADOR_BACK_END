import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

export class RoleDto {
  @ApiProperty({ description: 'Nombre del rol', example: 'landlord' })
  @IsString()
  @Length(2, 50, { message: 'El nombre del rol debe tener entre 2 y 50 caracteres' })
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del rol' })
  @IsOptional()
  @IsString()
  description?: string;
}



