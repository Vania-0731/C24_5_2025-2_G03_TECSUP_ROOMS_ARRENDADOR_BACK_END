import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LandlordsService } from '../services/landlords.service';
import { CreateLandlordDto } from '../dto/create-landlord.dto';
import { UpdateLandlordDto } from '../dto/update-landlord.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Landlords')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('landlords')
export class LandlordsController {
  constructor(private readonly service: LandlordsService) {}

  @Post()
  create(@Body() dto: CreateLandlordDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('me')
  async me(@Req() req: any) {
    const userId = req.user?.id;
    return this.service.findByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const entity = await this.service.findOne(id);
    const requesterId = req.user?.id || req.user?.sub;
    if (entity.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }
    return entity;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLandlordDto, @Req() req: any) {
    const entity = await this.service.findOne(id);
    const requesterId = req.user?.id || req.user?.sub;
    if (entity.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para actualizar este recurso');
    }
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const entity = await this.service.findOne(id);
    const requesterId = req.user?.id || req.user?.sub;
    if (entity.userId !== requesterId) {
      throw new ForbiddenException('No tienes permisos para eliminar este recurso');
    }
    return this.service.remove(id);
  }
}
