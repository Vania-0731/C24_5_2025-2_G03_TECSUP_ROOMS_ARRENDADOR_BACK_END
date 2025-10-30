import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto, @Req() req: any) {
    const userId = dto.userId || req.user?.id;
    return this.service.create({ ...dto, userId });
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
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
