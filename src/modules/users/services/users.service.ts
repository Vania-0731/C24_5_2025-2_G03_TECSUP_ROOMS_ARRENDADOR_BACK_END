import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario con este email ya existe');
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'fullName', 'email', 'phone', 'isVerified', 'createdAt'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['properties'],
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
      select: [
        'id', 'fullName', 'email', 'phone', 'dni', 'address', 'propertiesCount',
        'profilePicture', 'googleId', 'isVerified', 'isTwoFactorEnabled',
        'notificationSettings', 'appPreferences', 'createdAt', 'updatedAt'
      ],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<{ message: string; user: User }> {
    const user = await this.findById(id);
    
    // Actualizar solo los campos proporcionados
    Object.assign(user, updateUserDto);
    
    const updatedUser = await this.userRepository.save(user);
    
    return {
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    };
  }


  async checkRegistrationStatus(id: string): Promise<{
    isComplete: boolean;
    completedFields: string[];
    missingFields: string[];
    completionPercentage: number;
    nextSteps: string[];
  }> {
    const user = await this.findById(id);
    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const nextSteps: string[] = [];

    // Verificar campos obligatorios
    if (user.fullName && user.fullName.trim() !== '') completedFields.push('fullName');
    else missingFields.push('fullName');

    if (user.email && user.email.trim() !== '') completedFields.push('email');
    else missingFields.push('email');

    if (user.phone && user.phone.trim() !== '') completedFields.push('phone');
    else {
      missingFields.push('phone');
      nextSteps.push('Completar número de teléfono');
    }

    if (user.dni && user.dni.trim() !== '') completedFields.push('dni');
    else {
      missingFields.push('dni');
      nextSteps.push('Agregar DNI');
    }

    if (user.address && user.address.trim() !== '') completedFields.push('address');
    else {
      missingFields.push('address');
      nextSteps.push('Proporcionar dirección completa');
    }

    const completionPercentage = Math.round((completedFields.length / (completedFields.length + missingFields.length)) * 100);

    return {
      isComplete: missingFields.length === 0,
      completedFields,
      missingFields,
      completionPercentage,
      nextSteps
    };
  }

}
