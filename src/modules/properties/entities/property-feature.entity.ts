import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Property } from './property.entity';

@Entity('property_features')
export class PropertyFeature {
  @ApiProperty({ description: 'ID único de la característica' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre de la característica' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Valor de la característica' })
  @Column({ length: 255 })
  value: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @ApiProperty({ description: 'ID de la propiedad' })
  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, property => property.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;
}


