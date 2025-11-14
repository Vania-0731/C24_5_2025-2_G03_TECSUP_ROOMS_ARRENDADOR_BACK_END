import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { MediaType } from '../entities/media-file.entity';

export class CreateFileDto {
  @ApiProperty({ description: 'Nombre de archivo original' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'URL pública (S3) del recurso' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Clave S3 (key) del recurso' })
  @IsString()
  s3Key: string;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  contentType: string;

  @ApiProperty({ description: 'Tipo de medio', enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({ description: 'ID de la propiedad si aplica' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'ID de la carpeta si aplica' })
  @IsOptional()
  @IsString()
  folderId?: string;
}
