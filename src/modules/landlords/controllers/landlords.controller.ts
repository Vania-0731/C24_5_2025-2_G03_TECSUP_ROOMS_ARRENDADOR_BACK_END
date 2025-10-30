import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LandlordsService } from '../services/landlords.service';
import { CreateLandlordDto } from '../dto/create-landlord.dto';
import { UpdateLandlordDto } from '../dto/update-landlord.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

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
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLandlordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
