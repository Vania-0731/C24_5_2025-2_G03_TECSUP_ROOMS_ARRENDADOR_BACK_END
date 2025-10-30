import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandlordProfile } from '../entities/landlord.entity';
import { CreateLandlordDto } from '../dto/create-landlord.dto';
import { UpdateLandlordDto } from '../dto/update-landlord.dto';

@Injectable()
export class LandlordsService {
  constructor(
    @InjectRepository(LandlordProfile)
    private readonly repo: Repository<LandlordProfile>,
  ) {}

  async create(dto: CreateLandlordDto) {
    const existing = await this.repo.findOne({ where: { userId: dto.userId } });
    if (existing) throw new ConflictException('Landlord profile already exists for user');
    const entity = this.repo.create({
      ...dto,
      propertyCount: dto.propertyCount !== undefined ? String(dto.propertyCount) : '',
    });
    return this.repo.save(entity);
  }

  async ensureExistsForUser(userId: string) {
    let entity = await this.repo.findOne({ where: { userId } });
    if (!entity) {
      entity = this.repo.create({ userId, phone: '', dni: '', address: '', propertyCount: '' });
      entity = await this.repo.save(entity);
    }
    return entity;
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Landlord not found');
    return entity;
  }

  async findByUserId(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  async update(id: string, dto: UpdateLandlordDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { message: 'Landlord removed' };
  }
}
