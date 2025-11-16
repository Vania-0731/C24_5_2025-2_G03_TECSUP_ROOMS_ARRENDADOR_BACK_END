import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Property } from './property.entity';

@Entity('property_images')
export class PropertyImage {
  @ApiProperty({ description: 'ID único de la imagen' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'URL de la imagen' })
  @Column()
  url: string;

  @ApiProperty({ description: 'Nombre original del archivo' })
  @Column({ length: 255 })
  filename: string;

  @ApiProperty({ description: 'Indica si es una imagen 360°' })
  @Column({ default: false })
  is360Tour: boolean;

  @ApiProperty({ description: 'Orden de visualización' })
  @Column({ type: 'int', default: 0 })
  order: number;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  // Relaciones
  @ApiProperty({ description: 'ID de la propiedad' })
  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Property, property => property.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;
}


