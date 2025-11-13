import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../../users/entities/user.entity';

@ApiTags('Testing (Desarrollo)')
@Controller('auth-test')
export class AuthTestController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: 'TEST: Iniciar sesión con Google (Sin Frontend)',
    description: `
    Este endpoint es para probar Google OAuth sin frontend.
    
    INSTRUCCIONES:
    1. Abre esta URL directamente en tu navegador
    2. Serás redirigido a Google para autenticarte
    3. Después de autenticarte, verás tus datos de usuario en formato JSON
    
    URL COMPLETA: http://localhost:3000/auth-test/google
    `
  })
  @ApiResponse({ status: 200, description: 'Redirección a Google para autenticación' })
  async googleAuth(@Req() req: Request) {
    // Este endpoint inicia el flujo de OAuth2 de Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const result = await this.authService.generateJwtToken(user);
    
    // En lugar de redirigir al frontend, mostramos el resultado en formato JSON
    res.json({
      success: true,
      message: '¡Autenticación exitosa!',
      data: {
        accessToken: result.access_token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          profilePicture: user.profilePicture,
          isVerified: user.isVerified,
        },
        registrationComplete: true,
      },
      instructions: {
        message: 'Guarda este accessToken para usarlo en Swagger',
        howToUseInSwagger: [
          '1. Copia el accessToken de arriba',
          '2. Ve a Swagger: http://localhost:3000/api/docs',
          '3. Haz clic en el botón "Authorize" (candado verde)',
          '4. Pega el token en el campo "Value"',
          '5. Haz clic en "Authorize" y luego "Close"',
          '6. Ahora puedes probar todos los endpoints protegidos',
        ],
        nextSteps: ['Puedes usar los endpoints protegidos con el token generado'],
      },
    });
  }
}



