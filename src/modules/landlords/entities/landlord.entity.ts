import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('landlords')
export class LandlordProfile {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'FK to users.id' })
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @Column({ length: 20, default: '' })
  phone: string;

  @ApiProperty()
  @Column({ length: 15, default: '' })
  dni: string;

  @ApiProperty()
  @Column({ length: 500, default: '' })
  address: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: '' })
  propertyCount: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
