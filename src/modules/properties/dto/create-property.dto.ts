import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, IsDecimal } from 'class-validator';
import { PropertyType, BathroomType, PropertyStatus } from '../entities/property.entity';

export class CreatePropertyDto {
  @ApiProperty({ 
    description: 'Título del anuncio',
    example: 'Habitación acogedora cerca de TECSUP'
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Descripción detallada de la propiedad',
    example: 'Habitación amoblada con baño privado, perfecta para estudiantes. Incluye escritorio, cama, closet y conexión WiFi de alta velocidad.'
  })
  @IsString()
  description: string;

  @ApiProperty({ 
    description: 'Tipo de propiedad', 
    enum: PropertyType,
    example: 'room'
  })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty({ 
    description: 'Dirección de la propiedad',
    example: 'Av. Cascanueces 2221, Villa El Salvador'
  })
  @IsString()
  address: string;

  @ApiProperty({ 
    description: 'Ciudad',
    example: 'Lima'
  })
  @IsString()
  city: string;

  @ApiPropertyOptional({ 
    description: 'País', 
    default: 'Perú',
    example: 'Perú'
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ 
    description: 'Latitud para geolocalización',
    example: -12.2163
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ 
    description: 'Longitud para geolocalización',
    example: -76.9413
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ 
    description: 'Precio mensual',
    example: 800
  })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiPropertyOptional({ 
    description: 'Moneda', 
    default: 'PEN',
    example: 'PEN'
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Tamaño en metros cuadrados',
    example: 15
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @ApiProperty({ 
    description: 'Tipo de baño', 
    enum: BathroomType,
    example: 'private'
  })
  @IsEnum(BathroomType)
  bathroomType: BathroomType;

  @ApiPropertyOptional({ 
    description: 'Número de habitaciones',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ 
    description: 'Número de baños',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({ 
    description: 'Servicios incluidos',
    example: ['WiFi', 'Agua', 'Luz', 'Lavandería']
  })
  @IsArray()
  @IsString({ each: true })
  includedServices: string[];

  @ApiPropertyOptional({ 
    description: 'Reglas de la casa',
    example: 'No fumar, No mascotas, Horario de visitas hasta las 10pm'
  })
  @IsOptional()
  @IsString()
  houseRules?: string;

  @ApiPropertyOptional({ 
    description: 'Estado de la propiedad', 
    enum: PropertyStatus, 
    default: PropertyStatus.DRAFT,
    example: 'available'
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ 
    description: 'URL del tour virtual 360°',
    example: 'https://my.matterport.com/show/?m=example'
  })
  @IsOptional()
  @IsString()
  tour360Url?: string;

  @ApiPropertyOptional({ 
    description: 'IDs de archivos multimedia (imágenes/videos) ya subidos para asociar a la propiedad',
    isArray: true,
    example: ['uuid-1','uuid-2']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaFileIds?: string[];
}
