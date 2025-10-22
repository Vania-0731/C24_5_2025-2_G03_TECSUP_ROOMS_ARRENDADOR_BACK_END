import { ConfigService } from '@nestjs/config';

export const getAuthConfig = (configService: ConfigService) => ({
  jwt: {
    secret: configService.get<string>('JWT_SECRET'),
    expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
  },
  google: {
    clientId: configService.get<string>('GOOGLE_CLIENT_ID'),
    clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
    callbackUrl: configService.get<string>('GOOGLE_CALLBACK_URL'),
    scope: ['email', 'profile'],
  },
  // Configuración para restricciones de dominio
  domainRestrictions: {
    // Para arrendadores: cualquier dominio
    landlords: {
      allowedDomains: ['*'], // Cualquier dominio
      restrictedDomains: [], // Ningún dominio restringido
    },
    // Para arrendatarios: solo @tecsup.edu.pe (futuro)
    tenants: {
      allowedDomains: ['tecsup.edu.pe'],
      restrictedDomains: [],
    },
  },
});