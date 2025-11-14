import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ description: 'Nombre visible de la carpeta' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Ruta lógica completa', example: 'properties/{propertyId}/images/mi-carpeta' })
  @IsString()
  path: string;

  @ApiPropertyOptional({ description: 'ID de la propiedad si aplica' })
  @IsOptional()
  @IsString()
  propertyId?: string;
}
