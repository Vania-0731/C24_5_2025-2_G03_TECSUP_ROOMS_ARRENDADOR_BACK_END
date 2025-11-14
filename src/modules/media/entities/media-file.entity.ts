import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MediaFolder } from './media-folder.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AVATAR = 'avatar',
}

@Entity('media_files')
export class MediaFile {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre de archivo original' })
  @Column({ length: 255 })
  filename: string;

  @ApiProperty({ description: 'URL pública al recurso' })
  @Column({ length: 2048 })
  url: string;

  @ApiProperty({ description: 'Clave S3 (key)' })
  @Column({ length: 1024 })
  s3Key: string;

  @ApiProperty({ description: 'Tipo de medio', enum: MediaType })
  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @ApiProperty({ description: 'MIME type' })
  @Column({ length: 100 })
  contentType: string;

  @ApiProperty({ description: 'ID de la propiedad (opcional si es imagen de propiedad)' })
  @Column({ name: 'property_id', nullable: true })
  propertyId?: string;

  @ApiProperty({ description: 'ID del usuario dueño (p.ej. avatar)' })
  @Column({ name: 'owner_user_id', nullable: true })
  ownerUserId?: string;

  @ApiProperty({ description: 'Orden para galerías', required: false })
  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Carpeta contenedora' })
  @Column({ name: 'folder_id', nullable: true })
  folderId?: string;

  @ManyToOne(() => MediaFolder, folder => folder.files, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folder_id' })
  folder?: MediaFolder;
}
