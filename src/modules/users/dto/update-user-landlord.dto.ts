// src/modules/users/dto/update-user-landlord.dto.ts
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    fullName?: string;
}

export class UpdateLandlordDto {
    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    dni?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    propertiesCount?: string;
}

export class UpdateUserLandlordDto {
    @ValidateNested()
    @Type(() => UpdateUserDto)
    @IsOptional()
    user?: UpdateUserDto;

    @ValidateNested()
    @Type(() => UpdateLandlordDto)
    @IsOptional()
    landlord?: UpdateLandlordDto;
}