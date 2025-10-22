import { Controller, Get, Put, UseGuards, Req, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../entities/user.entity';

@ApiTags('Usuarios')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ 
    summary: 'Obtener perfil del usuario actual',
    description: 'Obtiene toda la información del perfil del usuario autenticado, incluyendo datos personales, configuración de notificaciones y preferencias de la aplicación.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil del usuario obtenido exitosamente',
    schema: {
      example: {
        id: 'uuid-string',
        fullName: 'María González Pérez',
        email: 'maria.gonzalez@gmail.com',
        phone: '987654321',
        dni: '12345678',
        address: 'Av. Arequipa 1234, Lima, Perú',
        propertiesCount: 3,
        profilePicture: 'https://lh3.googleusercontent.com/a/example',
        isVerified: true,
        isTwoFactorEnabled: false,
        notificationSettings: {
          email: {
            newRequests: true,
            newMessages: true,
            statusChanges: false,
            promotions: false,
            maintenance: true
          },
          push: {
            newRequests: true,
            newMessages: true,
            statusChanges: false,
            promotions: false
          },
          enabled: true
        },
        appPreferences: {
          theme: 'light',
          language: 'es',
          defaultCurrency: 'PEN',
          showDetailedPrices: false,
          developerMode: false,
          showTutorials: true
        },
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getProfile(@Req() req: Request & { user: User }) {
    return await this.usersService.getProfile(req.user.id);
  }

  @Put('me')
  @ApiOperation({ 
    summary: 'Actualizar perfil del usuario actual',
    description: 'Actualiza la información personal del usuario autenticado. Todos los campos son opcionales y solo se actualizarán los campos proporcionados.'
  })
  @ApiBody({ 
    type: UpdateUserDto,
    description: 'Datos del perfil a actualizar'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil actualizado exitosamente',
    schema: {
      example: {
        message: 'Perfil actualizado exitosamente',
        user: {
          id: 'uuid-string',
          fullName: 'María González Pérez',
          email: 'maria.gonzalez@gmail.com',
          phone: '987654321',
          dni: '12345678',
          address: 'Av. Arequipa 1234, Lima, Perú',
          propertiesCount: 3,
          profilePicture: 'https://lh3.googleusercontent.com/a/example',
          updatedAt: '2024-01-15T10:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async updateProfile(
    @Req() req: Request & { user: User },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Get('me/settings')
  @ApiOperation({ 
    summary: 'Obtener configuración del usuario actual',
    description: 'Obtiene la configuración completa del usuario, incluyendo preferencias de notificaciones y configuración de la aplicación.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Configuración obtenida exitosamente',
    schema: {
      example: {
        notificationSettings: {
          email: {
            newRequests: true,
            newMessages: true,
            statusChanges: false,
            promotions: false,
            maintenance: true
          },
          push: {
            newRequests: true,
            newMessages: true,
            statusChanges: false,
            promotions: false
          },
          enabled: true
        },
        appPreferences: {
          theme: 'light',
          language: 'es',
          defaultCurrency: 'PEN',
          showDetailedPrices: false,
          developerMode: false,
          showTutorials: true,
          customSettings: '{}'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getSettings(@Req() req: Request & { user: User }) {
    const user = await this.usersService.getProfile(req.user.id);
    return {
      notificationSettings: user.notificationSettings,
      appPreferences: user.appPreferences,
    };
  }

  @Get('me/registration-status')
  @ApiOperation({ 
    summary: 'Verificar estado del registro del usuario',
    description: 'Verifica si el registro del usuario está completo y proporciona información sobre qué campos faltan por completar.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del registro obtenido exitosamente',
    schema: {
      example: {
        isComplete: false,
        completedFields: ['email', 'fullName'],
        missingFields: ['phone', 'dni', 'address'],
        completionPercentage: 40,
        nextSteps: [
          'Completar número de teléfono',
          'Agregar DNI',
          'Proporcionar dirección completa'
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token de acceso inválido o expirado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getRegistrationStatus(@Req() req: Request & { user: User }) {
    return await this.usersService.checkRegistrationStatus(req.user.id);
  }
}
