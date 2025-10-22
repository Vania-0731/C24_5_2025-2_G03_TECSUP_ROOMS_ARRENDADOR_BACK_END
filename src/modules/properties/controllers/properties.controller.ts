import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { PropertiesService } from '../services/properties.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';

@ApiTags('Propiedades')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear nueva propiedad',
    description: 'Crea una nueva propiedad para el arrendador autenticado. Todos los campos son obligatorios excepto los marcados como opcionales. La propiedad se crea en estado "draft" por defecto.'
  })
  @ApiBody({ 
    type: CreatePropertyDto,
    description: 'Datos de la propiedad a crear'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Propiedad creada exitosamente',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Habitación acogedora cerca de TECSUP',
        description: 'Habitación amoblada con baño privado, perfecta para estudiantes.',
        propertyType: 'room',
        address: 'Av. Cascanueces 2221, Villa El Salvador',
        city: 'Lima',
        country: 'Perú',
        latitude: -12.2163,
        longitude: -76.9413,
        monthlyPrice: 800,
        currency: 'PEN',
        size: 15,
        bathroomType: 'private',
        bedrooms: 1,
        bathrooms: 1,
        includedServices: ['WiFi', 'Agua', 'Luz', 'Lavandería'],
        houseRules: 'No fumar, No mascotas, Horario de visitas hasta las 10pm',
        status: 'draft',
        tour360Url: 'https://my.matterport.com/show/?m=example',
        landlordId: 'uuid-string',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos o campos requeridos faltantes' })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Usuario no tiene permisos para crear propiedades' })
  @ApiResponse({ status: 422, description: 'Error de validación en los datos proporcionados' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async create(
    @Req() req: Request & { user: User },
    @Body() createPropertyDto: CreatePropertyDto,
  ) {
    return await this.propertiesService.create(createPropertyDto, req.user.id);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todas las propiedades del arrendador',
    description: 'Obtiene una lista paginada de todas las propiedades del arrendador autenticado, incluyendo información básica de cada propiedad.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de propiedades obtenida exitosamente',
    schema: {
      example: {
        properties: [
          {
            id: 'uuid-string',
            title: 'Habitación acogedora cerca de TECSUP',
            propertyType: 'room',
            address: 'Av. Cascanueces 2221, Villa El Salvador',
            city: 'Lima',
            monthlyPrice: 800,
            currency: 'PEN',
            status: 'available',
            createdAt: '2024-01-15T10:30:00.000Z'
          }
        ],
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findAll(@Req() req: Request & { user: User }) {
    return await this.propertiesService.findAllByLandlord(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de propiedades',
    description: 'Obtiene estadísticas detalladas de las propiedades del arrendador, incluyendo conteos por estado, ingresos y métricas de rendimiento.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estadísticas obtenidas exitosamente',
    schema: {
      example: {
        totalProperties: 5,
        availableProperties: 3,
        rentedProperties: 2,
        draftProperties: 1,
        totalRevenue: 1600,
        averagePrice: 800,
        occupancyRate: 40,
        propertiesByType: {
          room: 3,
          apartment: 2,
          house: 0
        },
        propertiesByCity: {
          'Lima': 4,
          'Arequipa': 1
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getStats(@Req() req: Request & { user: User }) {
    return await this.propertiesService.getStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener propiedad por ID',
    description: 'Obtiene los detalles completos de una propiedad específica del arrendador autenticado, incluyendo imágenes, características y solicitudes.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único de la propiedad',
    example: 'uuid-string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Propiedad encontrada exitosamente',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Habitación acogedora cerca de TECSUP',
        description: 'Habitación amoblada con baño privado, perfecta para estudiantes.',
        propertyType: 'room',
        address: 'Av. Cascanueces 2221, Villa El Salvador',
        city: 'Lima',
        country: 'Perú',
        latitude: -12.2163,
        longitude: -76.9413,
        monthlyPrice: 800,
        currency: 'PEN',
        size: 15,
        bathroomType: 'private',
        bedrooms: 1,
        bathrooms: 1,
        includedServices: ['WiFi', 'Agua', 'Luz', 'Lavandería'],
        houseRules: 'No fumar, No mascotas, Horario de visitas hasta las 10pm',
        status: 'available',
        tour360Url: 'https://my.matterport.com/show/?m=example',
        landlordId: 'uuid-string',
        images: [
          {
            id: 'uuid-string',
            url: 'https://example.com/image1.jpg',
            isPrimary: true,
            caption: 'Vista principal de la habitación'
          }
        ],
        features: [
          {
            id: 'uuid-string',
            name: 'WiFi',
            value: 'Alta velocidad',
            icon: 'wifi'
          }
        ],
        requests: [
          {
            id: 'uuid-string',
            status: 'pending',
            message: 'Interesado en alquilar',
            createdAt: '2024-01-15T10:30:00.000Z'
          }
        ],
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para acceder a esta propiedad' })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada' })
  @ApiResponse({ status: 422, description: 'ID de propiedad inválido' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ) {
    return await this.propertiesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Actualizar propiedad',
    description: 'Actualiza una propiedad existente del arrendador autenticado. Solo se actualizarán los campos proporcionados en el cuerpo de la petición.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único de la propiedad a actualizar',
    example: 'uuid-string'
  })
  @ApiBody({ 
    type: UpdatePropertyDto,
    description: 'Datos de la propiedad a actualizar'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Propiedad actualizada exitosamente',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Habitación actualizada cerca de TECSUP',
        description: 'Habitación amoblada con baño privado, perfecta para estudiantes.',
        propertyType: 'room',
        address: 'Av. Cascanueces 2221, Villa El Salvador',
        city: 'Lima',
        monthlyPrice: 850,
        currency: 'PEN',
        status: 'available',
        updatedAt: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar esta propiedad' })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada' })
  @ApiResponse({ status: 422, description: 'Error de validación en los datos proporcionados' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: Request & { user: User },
  ) {
    return await this.propertiesService.update(id, updatePropertyDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar propiedad',
    description: 'Elimina permanentemente una propiedad del arrendador autenticado. Esta acción no se puede deshacer y eliminará también todas las imágenes, características y solicitudes asociadas.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único de la propiedad a eliminar',
    example: 'uuid-string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Propiedad eliminada exitosamente',
    schema: {
      example: {
        message: 'Propiedad eliminada exitosamente',
        deletedProperty: {
          id: 'uuid-string',
          title: 'Habitación acogedora cerca de TECSUP'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar esta propiedad' })
  @ApiResponse({ status: 404, description: 'Propiedad no encontrada' })
  @ApiResponse({ status: 409, description: 'No se puede eliminar la propiedad porque tiene solicitudes activas' })
  @ApiResponse({ status: 422, description: 'ID de propiedad inválido' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ) {
    await this.propertiesService.remove(id, req.user.id);
    return { message: 'Propiedad eliminada exitosamente' };
  }
}
