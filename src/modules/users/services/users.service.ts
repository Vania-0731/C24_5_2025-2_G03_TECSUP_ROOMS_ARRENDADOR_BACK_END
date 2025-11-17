import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { LandlordProfile } from '../../landlords/entities/landlord.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserLandlordDto } from '../dto/update-user-landlord.dto';
import { RolesService } from '../../roles/services/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario con este email ya existe');
    }
    await this.rolesService.findOne(createUserDto.roleId);

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'fullName', 'email', 'isVerified', 'createdAt'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['properties', 'role'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (updateUserDto.roleId) {
      await this.rolesService.findOne(updateUserDto.roleId);
    }
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async getProfile(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
      select: [
        'id', 'fullName', 'email', 'roleId',
        'profilePicture', 'googleId', 'isVerified', 'isTwoFactorEnabled',
        'notificationSettings', 'appPreferences', 'createdAt', 'updatedAt'
      ],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (!user.role && user.roleId) {
      const role = await this.rolesService.findOne(user.roleId);
      user.role = role;
    }
    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<{ message: string; user: User }> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    return {
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    };
  }

  async updateUserAndLandlord(
    id: string,
    updateData: UpdateUserLandlordDto
  ): Promise<{ message: string; user: User }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      if (updateData.user) {
        Object.assign(user, updateData.user);
      }
      if (updateData.landlord) {
        const landlordRepo = queryRunner.manager.getRepository(LandlordProfile);
        let landlord = await landlordRepo.findOne({ where: { userId: id } });
        const { phone, dni, address } = updateData.landlord as any;
        const propsCount = (updateData.landlord as any).propertiesCount ?? (updateData.landlord as any).propertyCount;
        if (!landlord) {
          landlord = landlordRepo.create({
            userId: id,
            phone: phone ?? '',
            dni: dni ?? '',
            address: address ?? '',
            propertyCount: (propsCount ?? '').toString(),
          });
        } else {
          if (phone !== undefined) landlord.phone = phone;
          if (dni !== undefined) landlord.dni = dni;
          if (address !== undefined) landlord.address = address;
          if (propsCount !== undefined) landlord.propertyCount = String(propsCount);
        }

        await landlordRepo.save(landlord);
      }
      const updatedUser = await queryRunner.manager.save(User, user);
      await queryRunner.commitTransaction();
      return {
        message: 'Datos actualizados exitosamente',
        user: updatedUser,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async checkRegistrationStatus(id: string): Promise<{
    isComplete: boolean;
    completedFields: string[];
    missingFields: string[];
    completionPercentage: number;
    nextSteps: string[];
  }> {
    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const nextSteps: string[] = [];
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
      select: ['id', 'fullName', 'email', 'roleId']
    });
    if (user?.fullName && user.fullName.trim() !== '') completedFields.push('fullName');
    else missingFields.push('fullName');
    if (user?.email && user.email.trim() !== '') completedFields.push('email');
    else missingFields.push('email');
    let isComplete = false;
    const roleName = user?.role?.name;
    if (roleName === 'landlord') {
      const landlord = await this.dataSource.getRepository(LandlordProfile).findOne({ where: { userId: id } });
      isComplete = !!(
        landlord &&
        landlord.phone && landlord.phone.trim() !== '' &&
        landlord.dni && landlord.dni.trim() !== '' &&
        landlord.address && landlord.address.trim() !== '' &&
        landlord.propertyCount !== undefined && String(landlord.propertyCount).trim() !== ''
      );
      if (landlord) {
        if (landlord.phone && landlord.phone.trim() !== '') completedFields.push('landlord.phone');
        else { missingFields.push('landlord.phone'); nextSteps.push('Completar teléfono de arrendador'); }
        if (landlord.dni && landlord.dni.trim() !== '') completedFields.push('landlord.dni');
        else { missingFields.push('landlord.dni'); nextSteps.push('Agregar DNI de arrendador'); }
        if (landlord.address && landlord.address.trim() !== '') completedFields.push('landlord.address');
        else { missingFields.push('landlord.address'); nextSteps.push('Proporcionar dirección de arrendador'); }
        if (String(landlord.propertyCount || '').trim() !== '') completedFields.push('landlord.propertyCount');
        else { missingFields.push('landlord.propertyCount'); nextSteps.push('Indicar cantidad de propiedades'); }
      }
    } else if (roleName === 'tenant') {
      const tenant = await this.dataSource.getRepository(Tenant).findOne({ where: { userId: id } });
      isComplete = !!(
        tenant &&
        tenant.phone && tenant.phone.trim() !== '' &&
        tenant.code && tenant.code.trim() !== '' &&
        tenant.carrer && tenant.carrer.trim() !== '' &&
        tenant.cicle && tenant.cicle.trim() !== '' &&
        tenant.monthly_budget !== undefined &&
        tenant.origin_department && tenant.origin_department.trim() !== ''
      );
      if (tenant) {
        if (tenant.phone && tenant.phone.trim() !== '') completedFields.push('tenant.phone');
        else { missingFields.push('tenant.phone'); nextSteps.push('Completar teléfono de inquilino'); }
        if (tenant.code && tenant.code.trim() !== '') completedFields.push('tenant.code');
        else { missingFields.push('tenant.code'); nextSteps.push('Agregar código de estudiante'); }
        if (tenant.carrer && tenant.carrer.trim() !== '') completedFields.push('tenant.carrer');
        else { missingFields.push('tenant.carrer'); nextSteps.push('Agregar carrera'); }
        if (tenant.cicle && tenant.cicle.trim() !== '') completedFields.push('tenant.cicle');
        else { missingFields.push('tenant.cicle'); nextSteps.push('Agregar ciclo'); }
        if (tenant.monthly_budget !== undefined) completedFields.push('tenant.monthly_budget');
        else { missingFields.push('tenant.monthly_budget'); nextSteps.push('Indicar presupuesto mensual'); }
        if (tenant.origin_department && tenant.origin_department.trim() !== '') completedFields.push('tenant.origin_department');
        else { missingFields.push('tenant.origin_department'); nextSteps.push('Indicar departamento de origen'); }
      }
    }
    const completionPercentage = isComplete ? 100 : Math.round((completedFields.length / (completedFields.length + missingFields.length || 1)) * 100);
    return {
      isComplete,
      completedFields,
      missingFields,
      completionPercentage,
      nextSteps,
    };
  }
}
