import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/entities/user.entity';

export enum UserType {
  LANDLORD = 'landlord',
  TENANT = 'tenant',
}

@Injectable()
export class DomainValidationService {
  constructor(private readonly configService: ConfigService) {}

  validateEmailDomain(email: string, userType: UserType): boolean {
    const domain = email.split('@')[1];
    
    if (!domain) {
      throw new UnauthorizedException('Email inválido');
    }

    const restrictions = this.configService.get('domainRestrictions');
    
    if (!restrictions) {
      return true; // Si no hay restricciones configuradas, permitir cualquier dominio
    }

    const userRestrictions = restrictions[userType];
    
    if (!userRestrictions) {
      return true; // Si no hay restricciones para este tipo de usuario
    }

    // Verificar dominios permitidos
    if (userRestrictions.allowedDomains.length > 0) {
      const isAllowed = userRestrictions.allowedDomains.some(allowedDomain => {
        if (allowedDomain === '*') {
          return true; // Permitir cualquier dominio
        }
        return domain === allowedDomain;
      });

      if (!isAllowed) {
        throw new UnauthorizedException(
          `Dominio de email no permitido para ${userType}. Dominios permitidos: ${userRestrictions.allowedDomains.join(', ')}`
        );
      }
    }

    // Verificar dominios restringidos
    if (userRestrictions.restrictedDomains.length > 0) {
      const isRestricted = userRestrictions.restrictedDomains.includes(domain);
      
      if (isRestricted) {
        throw new UnauthorizedException(
          `Dominio de email restringido para ${userType}: ${domain}`
        );
      }
    }

    return true;
  }

  // Inferencia simple de rol basada en dominio del email
  // @tecsup.edu.pe => TENANT
  // cualquier otro dominio => LANDLORD
  inferRole(email: string): UserRole {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      // fallback conservador
      return UserRole.LANDLORD;
    }
    if (domain === 'tecsup.edu.pe') {
      return UserRole.TENANT;
    }
    return UserRole.LANDLORD;
  }

  getLandlordRestrictions() {
    return this.configService.get('domainRestrictions.landlords');
  }

  getTenantRestrictions() {
    return this.configService.get('domainRestrictions.tenants');
  }
}


