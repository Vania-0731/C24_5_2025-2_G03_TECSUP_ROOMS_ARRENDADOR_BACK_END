import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ActivitiesService } from '../services/activities.service';
import { ActivityLogDto } from '../dto/activity-log.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva actividad' })
  create(@Body() dto: ActivityLogDto) {
    return this.activitiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las actividades' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.activitiesService.findAll(limit || 50, offset || 0);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mis actividades recientes' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Número de días hacia atrás (default: 7)' })
  getMyActivities(@Req() req: any, @Query('days') days?: number) {
    const userId = req.user?.id;
    return this.activitiesService.getRecentActivity(userId, days || 7);
  }

  @Get('property/:propertyId/views')
  @ApiOperation({ summary: 'Obtener número de visualizaciones de una propiedad' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Número de días hacia atrás (default: 30)' })
  getPropertyViews(@Query('propertyId') propertyId: string, @Query('days') days?: number) {
    return this.activitiesService.getPropertyViews(propertyId, days || 30);
  }

  @Get('property/:propertyId/tours')
  @ApiOperation({ summary: 'Obtener número de tours 360° de una propiedad' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Número de días hacia atrás (default: 30)' })
  getTour360Views(@Query('propertyId') propertyId: string, @Query('days') days?: number) {
    return this.activitiesService.getTour360Views(propertyId, days || 30);
  }
}



