import { PropertyType, PropertyStatus, BathroomType } from '../entities/property.entity';

export interface IPropertySummary {
  id: string;
  title: string;
  address: string;
  city: string;
  monthlyPrice: number;
  currency: string;
  status: PropertyStatus;
  viewsCount: number;
  tours360Count: number;
  images: string[];
}

export interface IPropertyStats {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  totalViews: number;
  totalTours: number;
}

export interface IPropertyFilters {
  propertyType?: PropertyType;
  status?: PropertyStatus;
  bathroomType?: BathroomType;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  has360Tour?: boolean;
}


