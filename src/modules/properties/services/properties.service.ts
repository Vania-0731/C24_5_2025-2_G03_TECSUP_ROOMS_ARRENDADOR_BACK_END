import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    if (Array.isArray(mediaFileIds) && mediaFileIds.length > 0) {
      const files = await this.mediaFileRepository.findBy({ id: In(mediaFileIds) });
      const owned = files.filter(f => (f.ownerUserId === landlordId));
      if (owned.length) {
        for (const f of owned) {
          f.propertyId = savedProperty.id as any;
        }
        await this.mediaFileRepository.save(owned);
      }
    }
    try {
      await this.activities.logActivity(
        landlordId,
        EntityType.PROPERTY,
        ActionType.CREATE,
        (savedProperty as any).id,
        'Creaste una propiedad',
        { title: (savedProperty as any).title }
      );
    } catch (_) {}
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

    if (Array.isArray(mediaFileIds)) {
      // Associate provided files to this property (only those owned by landlord)
      const files = await this.mediaFileRepository.findBy({ id: In(mediaFileIds) });
      const owned = files.filter(f => f.ownerUserId === landlordId);
      if (owned.length) {
        for (const f of owned) {
          f.propertyId = saved.id as any;
        }
        await this.mediaFileRepository.save(owned);
      }
    }

    // Log activity: property updated
    try {
      await this.activities.logActivity(
        landlordId,
        EntityType.PROPERTY,
        ActionType.UPDATE,
        saved.id,
        'Actualizaste una propiedad',
        { title: saved.title }
      );
    } catch (_) {}
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
