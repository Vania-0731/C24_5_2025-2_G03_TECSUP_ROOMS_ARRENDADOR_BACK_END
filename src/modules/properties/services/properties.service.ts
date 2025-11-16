import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Property, PropertyStatus } from '../entities/property.entity';
import { PropertyImage } from '../entities/property-image.entity';
import { PropertyFeature } from '../entities/property-feature.entity';
import { MediaFile } from '../../media/entities/media-file.entity';
import { ActivitiesService } from '../../activities/services/activities.service';
import { EntityType, ActionType } from '../../activities/entities/activity-log.entity';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(PropertyImage)
    private readonly propertyImageRepository: Repository<PropertyImage>,
    @InjectRepository(PropertyFeature)
    private readonly propertyFeatureRepository: Repository<PropertyFeature>,
    @InjectRepository(MediaFile)
    private readonly mediaFileRepository: Repository<MediaFile>,
    private readonly activities: ActivitiesService,
  ) {}

  async create(createPropertyDto: any, landlordId: string): Promise<Property> {
    const { mediaFileIds, ...rest } = createPropertyDto || {};
    const property = this.propertyRepository.create({
      ...rest,
      landlordId,
    });
    const savedProperty = (await this.propertyRepository.save(property as any)) as Property;
    const operations: Promise<any>[] = [];
    if (Array.isArray(mediaFileIds) && mediaFileIds.length > 0) {
      operations.push(
        (async () => {
          const files = await this.mediaFileRepository.findBy({ id: In(mediaFileIds) });
          const owned = files.filter(f => (f.ownerUserId === landlordId));
          if (owned.length) {
            for (const f of owned) {
              f.propertyId = savedProperty.id as any;
            }
            await this.mediaFileRepository.save(owned);
            const propertyImages = owned
              .filter(f => f.type === 'image')
              .map((file, index) => {
                const is360 = file.filename.toLowerCase().includes('360') || file.filename.toLowerCase().includes('tour');
                return this.propertyImageRepository.create({
                  url: file.url,
                  filename: file.filename,
                  propertyId: savedProperty.id,
                  is360Tour: is360,
                  order: index,
                });
              });
            if (propertyImages.length > 0) {
              await this.propertyImageRepository.save(propertyImages);
            }
          }
        })()
      );
    }
    if (Array.isArray(createPropertyDto.includedServices) && createPropertyDto.includedServices.length > 0) {
      operations.push(
        (async () => {
          const features = createPropertyDto.includedServices.map((service: string) => {
            return this.propertyFeatureRepository.create({
              name: service,
              value: 'Incluido',
              propertyId: savedProperty.id,
            });
          });
          if (features.length > 0) {
            await this.propertyFeatureRepository.save(features);
          }
        })()
      );
    }

    await Promise.all(operations);
    this.activities.logActivity(
      landlordId,
      EntityType.PROPERTY,
      ActionType.CREATE,
      (savedProperty as any).id,
      'Creaste una propiedad',
      { title: (savedProperty as any).title }
    ).catch(() => {});

    return savedProperty as unknown as Property;
  }

  async findAllByLandlord(landlordId: string): Promise<Property[]> {
    return await this.propertyRepository.find({
      where: { landlordId },
      relations: ['images', 'features'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, landlordId?: string): Promise<Property> {
    const whereCondition: any = { id };
    if (landlordId) {
      whereCondition.landlordId = landlordId;
    }

    const property = await this.propertyRepository.findOne({
      where: whereCondition,
      relations: ['images', 'features', 'landlord'],
    });

    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    return property;
  }

  async update(id: string, updatePropertyDto: any, landlordId: string): Promise<Property> {
    const property = await this.findOne(id, landlordId);
    const { mediaFileIds, ...rest } = updatePropertyDto || {};

    Object.assign(property, rest);
    const saved = await this.propertyRepository.save(property);
    const operations: Promise<any>[] = [];
    if (Array.isArray(mediaFileIds)) {
      operations.push(
        (async () => {
          const currentFiles = await this.mediaFileRepository.findBy({ propertyId: saved.id });
          const filesToDisassociate = currentFiles.filter(f => !mediaFileIds.includes(f.id));
          
          if (filesToDisassociate.length > 0) {
            for (const f of filesToDisassociate) {
              f.propertyId = null as any;
            }
            await this.mediaFileRepository.save(filesToDisassociate);
            const imageUrlsToRemove = filesToDisassociate.map(f => f.url);
            if (imageUrlsToRemove.length > 0) {
              await this.propertyImageRepository
                .createQueryBuilder()
                .delete()
                .where('propertyId = :propertyId', { propertyId: saved.id })
                .andWhere('url IN (:...urls)', { urls: imageUrlsToRemove })
                .execute();
            }
          }

          const files = await this.mediaFileRepository.findBy({ id: In(mediaFileIds) });
          const owned = files.filter(f => f.ownerUserId === landlordId);
          if (owned.length) {
            for (const f of owned) {
              f.propertyId = saved.id as any;
            }
            await this.mediaFileRepository.save(owned);
            const existingImages = await this.propertyImageRepository.findBy({ propertyId: saved.id });
            const existingUrls = new Set(existingImages.map(img => img.url));
            const newImages = owned
              .filter(f => f.type === 'image' && !existingUrls.has(f.url))
              .map((file, index) => {
                const is360 = file.filename.toLowerCase().includes('360') || file.filename.toLowerCase().includes('tour');
                return this.propertyImageRepository.create({
                  url: file.url,
                  filename: file.filename,
                  propertyId: saved.id,
                  is360Tour: is360,
                  order: existingImages.length + index,
                });
              });
            if (newImages.length > 0) {
              await this.propertyImageRepository.save(newImages);
            }
          }
        })()
      );
    }
    if (Array.isArray(updatePropertyDto.includedServices)) {
      operations.push(
        (async () => {
          await this.propertyFeatureRepository.delete({ propertyId: saved.id });
          if (updatePropertyDto.includedServices.length > 0) {
            const features = updatePropertyDto.includedServices.map((service: string) => {
              return this.propertyFeatureRepository.create({
                name: service,
                value: 'Incluido',
                propertyId: saved.id,
              });
            });
            await this.propertyFeatureRepository.save(features);
          }
        })()
      );
    }
    await Promise.all(operations);

    this.activities.logActivity(
      landlordId,
      EntityType.PROPERTY,
      ActionType.UPDATE,
      saved.id,
      'Actualizaste una propiedad',
      { title: saved.title }
    ).catch(() => {});

    return saved;
  }

  async remove(id: string, landlordId: string): Promise<void> {
    const property = await this.findOne(id, landlordId);
    await this.propertyRepository.remove(property);
  }

  async getStats(landlordId: string) {
    const totalProperties = await this.propertyRepository.count({
      where: { landlordId },
    });

    const availableProperties = await this.propertyRepository.count({
      where: { landlordId, status: PropertyStatus.AVAILABLE },
    });

    const rentedProperties = await this.propertyRepository.count({
      where: { landlordId, status: PropertyStatus.RENTED },
    });

    const totalViews = await this.propertyRepository
      .createQueryBuilder('property')
      .select('SUM(property.viewsCount)', 'totalViews')
      .where('property.landlordId = :landlordId', { landlordId })
      .getRawOne();

    const totalTours = await this.propertyRepository
      .createQueryBuilder('property')
      .select('SUM(property.tours360Count)', 'totalTours')
      .where('property.landlordId = :landlordId', { landlordId })
      .getRawOne();

    return {
      totalProperties,
      availableProperties,
      rentedProperties,
      totalViews: parseInt(totalViews.totalViews) || 0,
      totalTours: parseInt(totalTours.totalTours) || 0,
    };
  }
}
