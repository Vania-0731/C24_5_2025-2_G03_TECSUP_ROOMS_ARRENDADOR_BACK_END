import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreatePresignDto } from './dto/create-presign.dto';
import { randomUUID } from 'crypto';
import { PropertiesService } from '../properties/services/properties.service';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private region: string;

  constructor(private readonly propertiesService: PropertiesService) {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || '';
    
    const credentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined;
    
    this.s3 = new S3Client({
      region: this.region,
      credentials,
    });
  }

  private getRoleName(role: any): string | null {
    if (!role) return null;
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && role.name) return role.name;
    if (role === 'landlord' || role === 'tenant' || role === 'admin') return role;
    return null;
  }

  async presignPut(dto: CreatePresignDto, userId?: string, role?: any) {
    const allowed = ['image/', 'video/'];
    if (!dto.contentType || !allowed.some(p => dto.contentType.startsWith(p))) {
      throw new BadRequestException('contentType debe ser image/* o video/*');
    }

    const filename = dto.filename || `${randomUUID()}`;
    const ext = dto.contentType?.includes('/') ? dto.contentType.split('/')[1] : 'bin';
    const originalFolder = (dto.folder || '').replace('{userId}', userId || '');
    const propMatch = originalFolder.match(/^properties\/([0-9a-fA-F-]{36})\//);
    if (propMatch) {
      const roleName = this.getRoleName(role);
      if (roleName && roleName !== 'landlord') {
        throw new ForbiddenException('Solo los arrendadores pueden subir a carpetas de propiedades');
      }
      const propertyId = propMatch[1];
      try {
        await this.propertiesService.findOne(propertyId, userId);
      } catch (e) {
        if (e instanceof NotFoundException) {
          throw new ForbiddenException('No puedes subir archivos a una propiedad que no te pertenece');
        }
        throw e;
      }
    }
    const rawFolder = originalFolder
      .replace('{userId}', userId || '')
      .replace(/\\+/g, '/');
    const sanitizeSegment = (seg: string) =>
      seg
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\-_/]/g, '')
        .replace(/-+/g, '-');
    const folder = rawFolder
      .split('/')
      .filter(Boolean)
      .map(sanitizeSegment)
      .join('/');
    const key = `${folder}/${filename}.${ext}`.replace(/\/+/, '/');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 }); // 5 min
    const baseUrl = process.env.AWS_S3_BASE_URL || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    return {
      uploadUrl,
      resourceUrl: `${baseUrl}/${key}`,
      key,
      bucket: this.bucket,
      expiresIn: 300,
    };
  }

  async deleteObject(s3Key: string): Promise<void> {
    if (!s3Key) {
      throw new BadRequestException('s3Key is required');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    try {
      await this.s3.send(command);
    } catch (error: any) {
      if (error.name !== 'NoSuchKey') {
        console.error('Error deleting object from S3:', error);
        throw new Error(`Failed to delete object from S3: ${error.message}`);
      }
    }
  }

  async deleteObjects(s3Keys: string[]): Promise<void> {
    if (!s3Keys || s3Keys.length === 0) {
      return;
    }

    // Eliminar archivos en paralelo
    const deletePromises = s3Keys.map(key => this.deleteObject(key));
    await Promise.allSettled(deletePromises);
  }
}
