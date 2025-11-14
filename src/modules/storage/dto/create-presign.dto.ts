import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePresignDto {
  @ApiProperty({ example: 'properties/{propertyId}/images' })
  @IsString()
  folder: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType: string;

  @ApiProperty({ required: false, example: 'photo.jpg' })
  @IsOptional()
  @IsString()
  filename?: string;
}
