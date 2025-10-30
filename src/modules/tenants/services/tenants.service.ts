import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto) {
    const exists = await this.repo.findOne({ where: { userId: dto.userId } });
    if (exists) throw new ConflictException('Tenant profile already exists for user');
    const entity = this.repo.create({
      ...dto,
      monthly_budget: dto.monthly_budget ? Number(dto.monthly_budget) : 0,
    } as DeepPartial<Tenant>);
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Tenant not found');
    return entity;
  }

  async findByUserId(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  async ensureExistsForUser(userId: string) {
    let entity = await this.repo.findOne({ where: { userId } });
    if (!entity) {
      entity = this.repo.create({
        userId,
        phone: '',
        code: '',
        carrer: '',
        cicle: '',
        monthly_budget: 0,
        origin_department: '',
      } as DeepPartial<Tenant>);
      entity = await this.repo.save(entity);
    }
    return entity;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    if (dto.monthly_budget !== undefined) {
      (entity as any).monthly_budget = Number(dto.monthly_budget);
    }
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repo.remove(entity);
    return { message: 'Tenant removed' };
  }
}

