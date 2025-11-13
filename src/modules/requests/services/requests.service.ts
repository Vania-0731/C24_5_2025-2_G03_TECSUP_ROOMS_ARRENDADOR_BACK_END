import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, RequestStatus } from '../entities/request.entity';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly repo: Repository<Request>,
  ) {}

  async create(dto: CreateRequestDto, tenantId: string) {
    const entity = this.repo.create({ ...dto, tenantId });
    return this.repo.save(entity);
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id }, relations: ['property', 'tenant'] });
    if (!entity) throw new NotFoundException('Solicitud no encontrada');
    return entity;
  }

  async listForLandlord(landlordId: string, status?: RequestStatus) {
    const qb = this.repo
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.property', 'property')
      .leftJoinAndSelect('req.tenant', 'tenant')
      .where('property.landlordId = :landlordId', { landlordId })
      .orderBy('req.createdAt', 'DESC');
    if (status) qb.andWhere('req.status = :status', { status });
    return qb.getMany();
  }

  async listForTenant(tenantId: string, status?: RequestStatus) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.repo.find({ where, relations: ['property'] , order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: RequestStatus, landlordId: string) {
    const req = await this.findOne(id);
    if (req.property.landlordId !== landlordId) {
      throw new ForbiddenException('No puedes actualizar esta solicitud');
    }
    req.status = status;
    return this.repo.save(req);
  }

  async update(id: string, dto: UpdateRequestDto, userTenantId?: string) {
    const req = await this.findOne(id);
    if (userTenantId && req.tenantId !== userTenantId) {
      throw new ForbiddenException('No puedes actualizar esta solicitud');
    }
    Object.assign(req, dto);
    return this.repo.save(req);
  }

  async remove(id: string, userTenantId?: string) {
    const req = await this.findOne(id);
    if (userTenantId && req.tenantId !== userTenantId) {
      throw new ForbiddenException('No puedes eliminar esta solicitud');
    }
    await this.repo.remove(req);
    return { message: 'Solicitud eliminada' };
  }
}
