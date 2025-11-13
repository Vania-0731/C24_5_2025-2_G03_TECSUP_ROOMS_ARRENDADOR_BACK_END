import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { PropertyImage } from './property-image.entity';
import { PropertyFeature } from './property-feature.entity';
import { Request } from '../../requests/entities/request.entity';

export enum PropertyType {
  ROOM = 'room',
  APARTMENT = 'apartment',
  HOUSE = 'house',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  RESERVED = 'reserved',
  DRAFT = 'draft',
}

export enum BathroomType {
  PRIVATE = 'private',
  SHARED = 'shared',
}

@Entity('properties')
export class Property {
  @ApiProperty({ description: 'ID único de la propiedad' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Título del anuncio' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ description: 'Descripción detallada de la propiedad' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Tipo de propiedad', enum: PropertyType })
  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  @ApiProperty({ description: 'Dirección de la propiedad' })
  @Column({ length: 500 })
  address: string;

  @ApiProperty({ description: 'Ciudad' })
  @Column({ length: 100 })
  city: string;

  @ApiProperty({ description: 'País' })
  @Column({ length: 100, default: 'Perú' })
  country: string;

  @ApiProperty({ description: 'Latitud para geolocalización', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @ApiProperty({ description: 'Longitud para geolocalización', required: false })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @ApiProperty({ description: 'Precio mensual' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyPrice: number;

  @ApiProperty({ description: 'Moneda' })
  @Column({ length: 3, default: 'PEN' })
  currency: string;

  @ApiProperty({ description: 'Tamaño en metros cuadrados', required: false })
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  size?: number;

  @ApiProperty({ description: 'Tipo de baño', enum: BathroomType })
  @Column({ type: 'enum', enum: BathroomType })
  bathroomType: BathroomType;

  @ApiProperty({ description: 'Número de habitaciones', required: false })
  @Column({ type: 'int', nullable: true })
  bedrooms?: number;

  @ApiProperty({ description: 'Número de baños', required: false })
  @Column({ type: 'int', nullable: true })
  bathrooms?: number;

  @ApiProperty({ description: 'Servicios incluidos' })
  @Column({ type: 'json', nullable: true })
  includedServices: string[];

  @ApiProperty({ description: 'Reglas de la casa', required: false })
  @Column({ type: 'text', nullable: true })
  houseRules?: string;

  @ApiProperty({ description: 'Estado de la propiedad', enum: PropertyStatus })
  @Column({ type: 'enum', enum: PropertyStatus, default: PropertyStatus.DRAFT })
  status: PropertyStatus;

  @ApiProperty({ description: 'Número de visualizaciones' })
  @Column({ default: 0 })
  viewsCount: number;

  @ApiProperty({ description: 'Número de tours 360° realizados' })
  @Column({ default: 0 })
  tours360Count: number;

  @ApiProperty({ description: 'URL del tour virtual 360°', required: false })
  @Column({ nullable: true })
  tour360Url?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ApiProperty({ description: 'ID del arrendador' })
  @Column({ name: 'landlord_id' })
  landlordId: string;

  @ManyToOne(() => User, user => user.properties)
  @JoinColumn({ name: 'landlord_id' })
  landlord: User;

  @OneToMany(() => PropertyImage, image => image.property)
  images: PropertyImage[];

  @OneToMany(() => PropertyFeature, feature => feature.property)
  features: PropertyFeature[];

  @OneToMany(() => Request, req => req.property)
  requests: Request[];
}
