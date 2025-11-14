import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MediaFile } from './media-file.entity';

@Entity('media_folders')
export class MediaFolder {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre visible de la carpeta' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Descripción de la carpeta', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Ruta lógica (e.g., properties/{id}/images/mi-carpeta)' })
  @Column({ length: 1024 })
  path: string;

  @ApiProperty({ description: 'ID del usuario dueño de la carpeta' })
  @Column({ name: 'owner_user_id' })
  ownerUserId: string;

  

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => MediaFile, file => file.folder)
  files: MediaFile[];
}
