import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';

export class AdminDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Permisos específicos del administrador' })
  @IsOptional()
  @IsObject()
  permissions?: {
    manageUsers?: boolean;
    manageProperties?: boolean;
    manageRequests?: boolean;
    viewReports?: boolean;
    systemSettings?: boolean;
  };

  @ApiPropertyOptional({ description: 'Última vez que inició sesión' })
  @IsOptional()
  @IsDateString()
  lastLoginAt?: Date;
}



