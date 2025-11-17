import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RequestsService } from '../services/requests.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequestStatus } from '../entities/request.entity';
import { TenantsService } from '../../tenants/services/tenants.service';

@ApiTags('Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly service: RequestsService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateRequestDto, @Req() req: any) {
    const tenant = await this.tenantsService.ensureExistsForUser(req.user.id);
    return this.service.create(dto, tenant.id);
  }

  @Get('landlord')
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  listForLandlord(@Req() req: any, @Query('status') status?: RequestStatus) {
    return this.service.listForLandlord(req.user.id, status);
  }

  @Get('me')
  @ApiQuery({ name: 'status', required: false, enum: RequestStatus })
  async listForTenant(@Req() req: any, @Query('status') status?: RequestStatus) {
    const tenant = await this.tenantsService.ensureExistsForUser(req.user.id);
    return this.service.listForTenant(tenant.id, status);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Req() req: any) {
    return this.service.updateStatus(id, RequestStatus.ACCEPTED, req.user.id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Req() req: any) {
    return this.service.updateStatus(id, RequestStatus.REJECTED, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequestDto, @Req() req: any) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user.id);
  }
}
