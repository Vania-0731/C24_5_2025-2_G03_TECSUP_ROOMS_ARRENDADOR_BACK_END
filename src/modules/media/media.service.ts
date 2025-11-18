import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaFolder } from './entities/media-folder.entity';
import { MediaFile, MediaType } from './entities/media-file.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaFolder) private readonly folderRepo: Repository<MediaFolder>,
    @InjectRepository(MediaFile) private readonly fileRepo: Repository<MediaFile>,
    private readonly storageService: StorageService,
  ) {}

  async createFolder(dto: CreateFolderDto, ownerUserId: string, ownerEmail?: string) {
    const sanitizeEmail = (email: string) => {
      return email
        .toLowerCase()
        .replace(/@/g, '-at-')
        .replace(/[^a-z0-9\-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    };
    
    let bucketPath = dto.path;
    if (ownerEmail) {
      const emailSuffix = sanitizeEmail(ownerEmail);
      if (bucketPath.includes('/')) {
        const parts = bucketPath.split('/');
        const lastPart = parts[parts.length - 1];
        parts[parts.length - 1] = `${lastPart}-${emailSuffix}`;
        bucketPath = parts.join('/');
      } else {
        bucketPath = `${bucketPath}-${emailSuffix}`;
      }
    }

    const entity = this.folderRepo.create({ 
      ...dto, 
      path: bucketPath,
      ownerUserId 
    });
    return this.folderRepo.save(entity);
  }

  async listFoldersByProperty(propertyId: string | undefined, ownerUserId: string) {
    const qb = this.folderRepo
      .createQueryBuilder('folder')
      .where('folder.ownerUserId = :ownerUserId', { ownerUserId });
    
    if (propertyId) {
      const prefix = `properties/${propertyId}/`;
      qb.andWhere('folder.path LIKE :prefix', { prefix: `${prefix}%` });
    }
    
    return qb.orderBy('folder.createdAt', 'DESC').getMany();
  }

  async registerFile(dto: CreateFileDto, ownerUserId: string) {
    const file = this.fileRepo.create({ ...dto, ownerUserId });
    return this.fileRepo.save(file);
  }

  async listFilesByProperty(propertyId: string, ownerUserId: string) {
    return this.fileRepo.find({ where: { propertyId, ownerUserId } });
  }

  async listFilesByFolder(folderId: string, ownerUserId: string) {
    const folder = await this.folderRepo.findOne({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.ownerUserId !== ownerUserId) throw new ForbiddenException();
    return this.fileRepo.find({ where: { folderId } });
  }

  async listMyFiles(ownerUserId: string, options?: { type?: MediaType | string; search?: string; limit?: number; offset?: number; }) {
    const qb = this.fileRepo
      .createQueryBuilder('file')
      .where('file.ownerUserId = :ownerUserId', { ownerUserId })
      .orderBy('file.createdAt', 'DESC');

    if (options?.type) {
      qb.andWhere('file.type = :type', { type: options.type });
    }
    if (options?.search) {
      qb.andWhere('(file.filename ILIKE :search OR file.url ILIKE :search)', { search: `%${options.search}%` });
    }
    if (typeof options?.limit === 'number') {
      qb.limit(options.limit);
    }
    if (typeof options?.offset === 'number') {
      qb.offset(options.offset);
    }

    return qb.getMany();
  }

  async updateFolder(id: string, data: Partial<MediaFolder>, ownerUserId: string) {
    const folder = await this.folderRepo.findOne({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.ownerUserId !== ownerUserId) throw new ForbiddenException();
    Object.assign(folder, data);
    return this.folderRepo.save(folder);
  }

  async deleteFolder(id: string, ownerUserId: string) {
    const folder = await this.folderRepo.findOne({ where: { id } });
    if (!folder) throw new NotFoundException('Folder not found');
    if (folder.ownerUserId !== ownerUserId) throw new ForbiddenException();
    const filesInFolder = await this.fileRepo.find({ where: { folderId: id } });
        if (filesInFolder.length > 0) {
      const s3Keys = filesInFolder
        .map(file => file.s3Key)
        .filter((key): key is string => !!key);
      
      if (s3Keys.length > 0) {
        await this.storageService.deleteObjects(s3Keys);
      }
    }
    if (filesInFolder.length > 0) {
      await this.fileRepo.remove(filesInFolder);
    }
    await this.folderRepo.remove(folder);
    
    return { 
      message: 'Folder deleted',
      deletedFiles: filesInFolder.length,
    };
  }

  async updateFile(id: string, data: Partial<MediaFile>, ownerUserId: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    if (file.ownerUserId !== ownerUserId) throw new ForbiddenException();
    Object.assign(file, data);
    return this.fileRepo.save(file);
  }

  async deleteFile(id: string, ownerUserId: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    if (file.ownerUserId !== ownerUserId) throw new ForbiddenException();
    if (file.s3Key) {
      await this.storageService.deleteObject(file.s3Key);
    }
    await this.fileRepo.remove(file);
    
    return { message: 'File deleted' };
  }
}
