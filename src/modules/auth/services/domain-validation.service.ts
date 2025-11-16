import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
      return true;
    }
    const userRestrictions = restrictions[userType];
    if (!userRestrictions) {
      return true;
    }
    if (userRestrictions.allowedDomains.length > 0) {
      const isAllowed = userRestrictions.allowedDomains.some(allowedDomain => {
        if (allowedDomain === '*') {
          return true;
        }
        return domain === allowedDomain;
      });
      if (!isAllowed) {
        throw new UnauthorizedException(
          `Dominio de email no permitido para ${userType}. Dominios permitidos: ${userRestrictions.allowedDomains.join(', ')}`
        );
      }
    }
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
  inferRole(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return 'landlord';
    }
    if (domain === 'tecsup.edu.pe') {
      return 'tenant';
    }
    return 'landlord';
  }

  getLandlordRestrictions() {
    return this.configService.get('domainRestrictions.landlords');
  }

  getTenantRestrictions() {
    return this.configService.get('domainRestrictions.tenants');
  }
}


