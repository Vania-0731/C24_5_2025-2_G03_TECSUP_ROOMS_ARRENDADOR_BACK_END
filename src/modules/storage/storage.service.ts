import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreatePresignDto } from './dto/create-presign.dto';
import { randomUUID } from 'crypto';
import { PropertiesService } from '../properties/services/properties.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;
  private region: string;

  constructor(private readonly propertiesService: PropertiesService) {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.s3 = new S3Client({ region: this.region });
  }

  async presignPut(dto: CreatePresignDto, userId?: string, role?: UserRole | string) {
    // Validate content type
    const allowed = ['image/', 'video/'];
    if (!dto.contentType || !allowed.some(p => dto.contentType.startsWith(p))) {
      throw new BadRequestException('contentType debe ser image/* o video/*');
    }

    const filename = dto.filename || `${randomUUID()}`;
    const ext = dto.contentType?.includes('/') ? dto.contentType.split('/')[1] : 'bin';

    // If path targets a property, validate landlord ownership
    const originalFolder = (dto.folder || '').replace('{userId}', userId || '');
    const propMatch = originalFolder.match(/^properties\/([0-9a-fA-F-]{36})\//);
    if (propMatch) {
      // Only landlords can upload to properties/*
      if (role && role !== UserRole.LANDLORD && role !== 'landlord') {
        throw new ForbiddenException('Solo los arrendadores pueden subir a carpetas de propiedades');
      }
      const propertyId = propMatch[1];
      try {
        // Will throw if not belongs to landlord
        await this.propertiesService.findOne(propertyId, userId);
      } catch (e) {
        if (e instanceof NotFoundException) {
          throw new ForbiddenException('No puedes subir archivos a una propiedad que no te pertenece');
        }
        throw e;
      }
    }

    // Sanitize and normalize folder allowing human-readable names
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
}
