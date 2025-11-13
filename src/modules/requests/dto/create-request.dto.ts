import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, Length } from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({ description: 'ID de la propiedad objetivo' })
  @IsUUID()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Mensaje del interesado' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  message?: string;
}
