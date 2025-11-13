import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Request } from '../../requests/entities/request.entity';

@Entity('tenants')
export class Tenant {
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
  @Column({ length: 20 })
  phone: string;

  @ApiProperty()
  @Column({ length: 50 })
  code: string;

  @ApiProperty()
  @Column({ length: 100 })
  carrer: string;

  @ApiProperty()
  @Column({ length: 50 })
  cicle: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthly_budget: number;

  @ApiProperty()
  @Column({ length: 100 })
  origin_department: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Request, req => req.tenant)
  requests: Request[];
}
