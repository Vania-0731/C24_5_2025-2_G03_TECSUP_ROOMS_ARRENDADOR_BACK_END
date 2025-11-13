import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Property } from '../../properties/entities/property.entity';

export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID único del usuario' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre completo del arrendador' })
  @Column({ length: 255 })
  fullName: string;

  @ApiProperty({ description: 'Email del arrendador (cualquier dominio)' })
  @Column({ unique: true, length: 255 })
  email: string;

  @ApiProperty({ description: 'Rol del usuario', enum: UserRole, example: UserRole.TENANT })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT })
  role: UserRole;

  

  @ApiProperty({ description: 'URL de la foto de perfil', required: false })
  @Column({ nullable: true })
  profilePicture?: string;

  @ApiProperty({ description: 'ID de Google para OAuth2', required: false })
  @Column({ nullable: true, unique: true })
  googleId?: string;

  @ApiProperty({ description: 'Indica si el usuario está verificado' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Indica si el usuario tiene 2FA activado' })
  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @ApiProperty({ description: 'Secreto para 2FA', required: false })
  @Column({ nullable: true })
  twoFactorSecret?: string;

  @ApiProperty({ description: 'Configuración de notificaciones', required: false })
  @Column({ type: 'json', nullable: true })
  notificationSettings?: {
    receiveNewRequests: boolean;
    receiveNewMessages: boolean;
    notifyTour360View: boolean;
  };

  @ApiProperty({ description: 'Preferencias de la aplicación', required: false })
  @Column({ type: 'json', nullable: true })
  appPreferences?: {
    language: string;
    timezone: string;
  };

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Property, property => property.landlord)
  properties: Property[];
}
