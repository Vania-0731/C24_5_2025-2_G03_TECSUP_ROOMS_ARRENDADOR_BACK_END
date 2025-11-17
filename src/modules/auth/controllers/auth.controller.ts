import { Controller, Get, Post, UseGuards, Req, Res, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { RegisterLandlordDto } from '../dto/register-landlord.dto';
import { UsersService } from '../../users/services/users.service';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar sesión con Google OAuth2' })
  @ApiResponse({ status: 200, description: 'Redirección a Google para autenticación' })
  async googleAuth(@Req() req: Request) {
    // Este endpoint inicia el flujo de OAuth2 de Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback de Google OAuth2' })
  @ApiResponse({ status: 200, description: 'Usuario autenticado exitosamente' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const result = await this.authService.generateJwtToken(user);
    
    // Redirigir al frontend con el token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    
    // Si el usuario no tiene todos los datos completos, redirigir al formulario de registro
    const status = await this.usersService.checkRegistrationStatus(user.id);
    if (!status.isComplete) {
      res.redirect(`${frontendUrl}/complete-registration?token=${result.access_token}`);
    } else {
      res.redirect(`${frontendUrl}/dashboard?token=${result.access_token}`);
    }
  }

  @Post('complete-registration')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Completar registro de arrendador' })
  @ApiResponse({ status: 200, description: 'Registro completado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async completeRegistration(
    @Req() req: Request & { user: User },
    @Body() registerData: RegisterLandlordDto,
  ) {
    const user = await this.authService.completeRegistration(req.user.id, registerData);
    return {
      message: 'Registro completado exitosamente',
      user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario actual' })
  @ApiResponse({ status: 200, description: 'Información del usuario actual' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout() {
    return { message: 'Sesión cerrada exitosamente' };
  }

  @Post('sync/google')
  @ApiOperation({ summary: 'Sincronizar usuario desde NextAuth (Google OAuth)' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado o ya existente' })
  async syncGoogleUser(@Body() payload: any, @Res() res: Response) {
    const { user, created, updated } = await this.authService.syncGoogleUserFromNextAuth(payload);
    const { access_token } = await this.authService.generateJwtToken(user);
    const userWithRole = await this.usersService.findById(user.id);
    const minimalUser = { id: userWithRole.id, role: userWithRole.role };

    let registrationComplete = true;
    
    if (created) {
      registrationComplete = false;
    } else {
      registrationComplete = true;
    }

    const payloadResp = { 
      user: minimalUser, 
      access_token, 
      registrationComplete,
      created: !!created,
    } as any;

    if (created) {
      return res.status(201).json(payloadResp);
    }

    if (updated) {
      return res.status(200).json(payloadResp);
    }

    return res.status(200).json(payloadResp);
  }
}
