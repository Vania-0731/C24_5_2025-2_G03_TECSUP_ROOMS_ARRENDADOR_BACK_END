import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateLandlordDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  @Length(6, 20)
  phone: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[0-9]{8}$/)
  dni: string;

  @ApiProperty()
  @IsString()
  @Length(5, 500)
  address: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  propertyCount?: string;
}
