import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entities/admin.entity';
import { AdminDto } from '../dto/admin.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async create(dto: AdminDto): Promise<Admin> {
    const existing = await this.adminRepository.findOne({ where: { userId: dto.userId } });
    if (existing) {
      throw new ConflictException('El perfil de administrador ya existe para este usuario');
    }

    const admin = this.adminRepository.create(dto);
    return await this.adminRepository.save(admin);
  }

  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!admin) {
      throw new NotFoundException('Administrador no encontrado');
    }
    return admin;
  }

  async findByUserId(userId: string): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(id: string, dto: Partial<AdminDto>): Promise<Admin> {
    const admin = await this.findOne(id);
    Object.assign(admin, dto);
    return await this.adminRepository.save(admin);
  }

  async updateLastLogin(userId: string): Promise<void> {
    const admin = await this.findByUserId(userId);
    if (admin) {
      admin.lastLoginAt = new Date();
      await this.adminRepository.save(admin);
    }
  }

  async remove(id: string): Promise<void> {
    const admin = await this.findOne(id);
    await this.adminRepository.remove(admin);
  }
}



