import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse } from '@nestjs/swagger';
import { AdminsService } from '../services/admins.service';
import { AdminDto } from '../dto/admin.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Admins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo perfil de administrador' })
  create(@Body() dto: AdminDto) {
    return this.adminsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los administradores' })
  findAll() {
    return this.adminsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil de administrador' })
  async me(@Req() req: any) {
    const userId = req.user?.id;
    return this.adminsService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un administrador por ID' })
  @ApiForbiddenResponse({ description: 'No tienes permisos para acceder a este recurso' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const entity = await this.adminsService.findOne(id);
    const requesterId = req.user?.id || req.user?.sub;
    if (entity.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }
    return entity;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un administrador' })
  @ApiForbiddenResponse({ description: 'No tienes permisos para actualizar este recurso' })
  async update(@Param('id') id: string, @Body() dto: Partial<AdminDto>, @Req() req: any) {
    const entity = await this.adminsService.findOne(id);
    const requesterId = req.user?.id || req.user?.sub;
    if (entity.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para actualizar este recurso');
    }
    return this.adminsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un administrador' })
  @ApiForbiddenResponse({ description: 'No tienes permisos para eliminar este recurso' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const entity = await this.adminsService.findOne(id);
    const requesterId = req.user?.id || req.user?.sub;
    if (entity.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para eliminar este recurso');
    }
    return this.adminsService.remove(id);
  }
}



