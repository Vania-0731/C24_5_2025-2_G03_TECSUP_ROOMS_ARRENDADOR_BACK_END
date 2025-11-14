import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePresignDto } from './dto/create-presign.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Genera URL firmada para subir a S3 (PUT)' })
  async presign(@Body() dto: CreatePresignDto, @Req() req: any) {
    return this.storage.presignPut(dto, req.user?.id, req.user?.role);
  }

  @Post('presign/avatar')
  @ApiOperation({ summary: 'Genera URL firmada para subir avatar del usuario (solo imágenes)' })
  async presignAvatar(@Body() dto: Partial<CreatePresignDto>, @Req() req: any) {
    const folder = `users/${req.user?.id}/avatar`;
    const body = {
      folder,
      contentType: dto.contentType || 'image/jpeg',
      filename: dto.filename,
    } as CreatePresignDto;
    return this.storage.presignPut(body, req.user?.id, req.user?.role);
  }
}
