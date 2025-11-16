import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('admins')
export class Admin {
  @ApiProperty({ description: 'ID único del administrador' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'FK to users.id' })
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Permisos específicos del administrador', required: false })
  @Column({ type: 'json', nullable: true })
  permissions?: {
    manageUsers: boolean;
    manageProperties: boolean;
    manageRequests: boolean;
    viewReports: boolean;
    systemSettings: boolean;
  };

  @ApiProperty({ description: 'Última vez que inició sesión', required: false })
  @Column({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @UpdateDateColumn()
  updatedAt: Date;
}



