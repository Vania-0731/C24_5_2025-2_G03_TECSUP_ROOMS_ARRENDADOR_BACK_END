import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { MediaType } from './entities/media-file.entity';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('folders')
  @ApiOperation({ summary: 'Crear carpeta (solo landlord)' })
  createFolder(@Body() dto: CreateFolderDto, @Req() req: any) {
    return this.media.createFolder(dto, req.user.id, req.user.email);
  }

  @Get('folders')
  @ApiOperation({ summary: 'Listar carpetas del landlord (opcionalmente filtradas por propiedad)' })
  listFolders(@Req() req: any, @Query('propertyId') propertyId?: string) {
    return this.media.listFoldersByProperty(propertyId, req.user.id);
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'Actualizar carpeta' })
  updateFolder(@Param('id') id: string, @Body() body: Partial<CreateFolderDto>, @Req() req: any) {
    return this.media.updateFolder(id, body as any, req.user.id);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Eliminar carpeta' })
  deleteFolder(@Param('id') id: string, @Req() req: any) {
    return this.media.deleteFolder(id, req.user.id);
  }

  @Post('files')
  @ApiOperation({ summary: 'Registrar archivo subido (imagen, video, avatar)' })
  createFile(@Body() dto: CreateFileDto, @Req() req: any) {
    return this.media.registerFile(dto, req.user.id);
  }

  @Get('files')
  @ApiOperation({ summary: 'Listar archivos por propiedad' })
  listFiles(@Query('propertyId') propertyId: string, @Req() req: any) {
    return this.media.listFilesByProperty(propertyId, req.user.id);
  }

  @Get('my-files')
  @ApiOperation({ summary: 'Listar todos mis archivos (imágenes y videos) con filtros opcionales' })
  listMyFiles(
    @Req() req: any,
    @Query('type') type?: MediaType,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.media.listMyFiles(req.user.id, {
      type,
      search,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('folders/:id/files')
  @ApiOperation({ summary: 'Listar archivos por carpeta' })
  listFilesByFolder(@Param('id') id: string, @Req() req: any) {
    return this.media.listFilesByFolder(id, req.user.id);
  }

  @Patch('files/:id')
  @ApiOperation({ summary: 'Actualizar archivo (nombre, order, etc.)' })
  updateFile(@Param('id') id: string, @Body() body: Partial<CreateFileDto>, @Req() req: any) {
    return this.media.updateFile(id, body as any, req.user.id);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Eliminar archivo' })
  deleteFile(@Param('id') id: string, @Req() req: any) {
    return this.media.deleteFile(id, req.user.id);
  }
}
