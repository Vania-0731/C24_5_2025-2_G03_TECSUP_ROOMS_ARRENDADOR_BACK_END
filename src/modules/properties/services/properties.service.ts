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
            const tour360FileIds = Array.isArray(createPropertyDto.tour360FileIds) ? createPropertyDto.tour360FileIds : [];
            const coverImageFileId = createPropertyDto.coverImageFileId;
            
            const imageFiles = owned.filter(f => f.type === 'image');
            const regularImages: any[] = [];
            const tour360Images: any[] = [];
            
            imageFiles.forEach((file) => {
              const lower = file.filename.toLowerCase();
              const autoDetect = lower.includes('360') || lower.includes('tour') || 
                                lower.includes('equirectangular') || lower.includes('panorama') ||
                                lower.includes('panoramic') || lower.includes('vr') || lower.includes('virtual');
              const is360 = tour360FileIds.includes(file.id) || autoDetect;
              
              if (is360) {
                tour360Images.push({ file, is360: true });
              } else {
                regularImages.push({ file, is360: false });
              }
            });
            
            const propertyImages: any[] = [];
            let orderCounter = 0;
            
            if (coverImageFileId) {
              const coverFile = regularImages.find(item => item.file.id === coverImageFileId);
              if (coverFile) {
                propertyImages.push(this.propertyImageRepository.create({
                  url: coverFile.file.url,
                  filename: coverFile.file.filename,
                  propertyId: savedProperty.id,
                  is360Tour: false,
                  order: 0,
                }));
                orderCounter = 1;
                regularImages.splice(regularImages.indexOf(coverFile), 1);
              }
            } else if (regularImages.length > 0) {
              const firstRegular = regularImages.shift();
              propertyImages.push(this.propertyImageRepository.create({
                url: firstRegular.file.url,
                filename: firstRegular.file.filename,
                propertyId: savedProperty.id,
                is360Tour: false,
                order: 0,
              }));
              orderCounter = 1;
            }
            
            regularImages.forEach((item) => {
              propertyImages.push(this.propertyImageRepository.create({
                url: item.file.url,
                filename: item.file.filename,
                propertyId: savedProperty.id,
                is360Tour: false,
                order: orderCounter++,
              }));
            });
            
            tour360Images.forEach((item) => {
              propertyImages.push(this.propertyImageRepository.create({
                url: item.file.url,
                filename: item.file.filename,
                propertyId: savedProperty.id,
                is360Tour: true,
                order: orderCounter++,
              }));
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
            const tour360FileIds = Array.isArray(updatePropertyDto.tour360FileIds) ? updatePropertyDto.tour360FileIds : [];
            const coverImageFileId = updatePropertyDto.coverImageFileId;
            
            const filesMap = new Map(owned.map(f => [f.id, f]));
            const imageFiles = owned.filter(f => f.type === 'image');
            const regularImages: any[] = [];
            const tour360Images: any[] = [];
            
            imageFiles.forEach((file) => {
              const lower = file.filename.toLowerCase();
              const autoDetect = lower.includes('360') || lower.includes('tour') || 
                                lower.includes('equirectangular') || lower.includes('panorama') ||
                                lower.includes('panoramic') || lower.includes('vr') || lower.includes('virtual');
              const is360 = tour360FileIds.includes(file.id) || autoDetect;
              
              if (is360) {
                tour360Images.push({ file, is360: true });
              } else {
                regularImages.push({ file, is360: false });
              }
            });
            
            for (const existingImg of existingImages) {
              const matchingFile = Array.from(filesMap.values()).find(f => f.url === existingImg.url);
              if (matchingFile) {
                const lower = matchingFile.filename.toLowerCase();
                const autoDetect = lower.includes('360') || lower.includes('tour') || 
                                  lower.includes('equirectangular') || lower.includes('panorama') ||
                                  lower.includes('panoramic') || lower.includes('vr') || lower.includes('virtual');
                existingImg.is360Tour = tour360FileIds.includes(matchingFile.id) || autoDetect;
                if (coverImageFileId && matchingFile.id === coverImageFileId && !existingImg.is360Tour) {
                  existingImg.order = 0;
                } else if (!coverImageFileId && existingImg.order === 0 && !existingImg.is360Tour) {
                  existingImg.order = 0;
                }
              }
            }
            
            const newRegularImages = regularImages.filter(item => !existingUrls.has(item.file.url));
            const newTour360Images = tour360Images.filter(item => !existingUrls.has(item.file.url));
            
            const existingRegularImages = existingImages.filter(img => !img.is360Tour);
            let orderCounter = existingRegularImages.length > 0 ? 1 : 0;
            
            if (coverImageFileId) {
              const coverFile = regularImages.find(item => item.file.id === coverImageFileId);
              if (coverFile) {
                const existingCover = existingImages.find(img => img.url === coverFile.file.url);
                if (existingCover) {
                  existingCover.order = 0;
                  for (const img of existingImages) {
                    if (img.id !== existingCover.id && img.order === 0) {
                      img.order = orderCounter++;
                    }
                  }
                } else {
                  newRegularImages.unshift(coverFile);
                  const coverIndex = newRegularImages.indexOf(coverFile);
                  if (coverIndex > 0) {
                    newRegularImages.splice(coverIndex, 1);
                    newRegularImages.unshift(coverFile);
                  }
                }
              }
            }
            
            await this.propertyImageRepository.save(existingImages);
            
            const newImages: any[] = [];
            
            if (coverImageFileId) {
              const coverFile = newRegularImages.find(item => item.file.id === coverImageFileId);
              if (coverFile) {
                newImages.push(this.propertyImageRepository.create({
                  url: coverFile.file.url,
                  filename: coverFile.file.filename,
                  propertyId: saved.id,
                  is360Tour: false,
                  order: 0,
                }));
                newRegularImages.splice(newRegularImages.indexOf(coverFile), 1);
                orderCounter = 1;
              }
            } else if (newRegularImages.length > 0 && existingImages.filter(img => img.order === 0).length === 0) {
              const firstRegular = newRegularImages.shift();
              newImages.push(this.propertyImageRepository.create({
                url: firstRegular.file.url,
                filename: firstRegular.file.filename,
                propertyId: saved.id,
                is360Tour: false,
                order: 0,
              }));
              orderCounter = 1;
            }
            
            newRegularImages.forEach((item) => {
              newImages.push(this.propertyImageRepository.create({
                url: item.file.url,
                filename: item.file.filename,
                propertyId: saved.id,
                is360Tour: false,
                order: orderCounter++,
              }));
            });
            
            newTour360Images.forEach((item) => {
              newImages.push(this.propertyImageRepository.create({
                url: item.file.url,
                filename: item.file.filename,
                propertyId: saved.id,
                is360Tour: true,
                order: orderCounter++,
              }));
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
