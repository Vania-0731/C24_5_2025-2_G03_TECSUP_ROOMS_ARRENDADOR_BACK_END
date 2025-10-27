import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { DomainValidationService, UserType } from './domain-validation.service';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly domainValidationService: DomainValidationService,
  ) {}

  async validateGoogleUser(profile: any): Promise<User> {
    const { id, emails, name, photos } = profile;
    
    const email = emails[0].value;
    const fullName = `${name.givenName} ${name.familyName}`;
    const profilePicture = photos[0]?.value;

    // Validar dominio para arrendadores (cualquier dominio permitido por ahora)
    this.domainValidationService.validateEmailDomain(email, UserType.LANDLORD);

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Crear nuevo usuario arrendador con Google OAuth
      try {
        user = await this.usersService.create({
          fullName,
          email,
          profilePicture,
          googleId: id,
          phone: '', // Se completará en el formulario de registro
          dni: '', // Se completará en el formulario de registro
          address: '', // Se completará en el formulario de registro
          propertiesCount: 0,
          isVerified: true, // Los usuarios de Google están verificados por defecto
        });
      } catch (e) {
        if (e instanceof ConflictException) {
          // Si alguien creó el usuario en paralelo, recuperar y actualizar googleId
          const existing = await this.usersService.findByEmail(email);
          if (existing && !existing.googleId) {
            user = await this.usersService.update(existing.id, {
              googleId: id,
              profilePicture,
              isVerified: true,
            });
          } else if (existing) {
            user = existing;
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
    } else if (!user.googleId) {
      // Si el usuario existe pero no tiene googleId, lo actualizamos
      user = await this.usersService.update(user.id, {
        googleId: id,
        profilePicture,
        isVerified: true,
      });
    }

    return user;
  }

  async generateJwtToken(user: User): Promise<{ access_token: string; user: User }> {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user,
    };
  }

  async syncGoogleUserFromNextAuth(payload: {
    email?: string;
    name?: string;
    image?: string;
    provider?: string;
    providerAccountId?: string;
    profile?: any;
    role?: string;
  }): Promise<{ user: User; created: boolean; updated: boolean }> {
    const email = payload.email?.trim();
    const fullName = payload.name ?? '';
    const profilePicture = payload.image;
    const googleId = payload.providerAccountId;
    const incomingRole = (payload.role as string | undefined)?.toLowerCase();

    if (!email) {
      throw new Error('Email is required');
    }

    // Determinar rol: usar payload válido o inferir por dominio
    let desiredRole: UserRole | undefined;
    if (incomingRole === UserRole.TENANT || incomingRole === 'tenant') {
      desiredRole = UserRole.TENANT;
    } else if (incomingRole === UserRole.LANDLORD || incomingRole === 'landlord') {
      desiredRole = UserRole.LANDLORD;
    } else {
      desiredRole = this.domainValidationService.inferRole(email);
    }

    let user = await this.usersService.findByEmail(email);
    let created = false;
    let updated = false;

    if (!user) {
      try {
        user = await this.usersService.create({
          fullName: fullName || email,
          email,
          profilePicture,
          googleId,
          phone: '',
          dni: '',
          address: '',
          propertiesCount: 0,
          isVerified: true,
          role: desiredRole,
        } as any);
        created = true;
      } catch (e) {
        if (e instanceof ConflictException) {
          // Usuario creado concurrentemente: recuperar y pasar a actualizar
          user = await this.usersService.findByEmail(email) as User;
        } else {
          throw e;
        }
      }
    } else {
      const updates: any = {};
      if (!user.googleId && googleId) updates.googleId = googleId;
      if (profilePicture && user.profilePicture !== profilePicture) updates.profilePicture = profilePicture;
      if (!user.isVerified) updates.isVerified = true;
      if (desiredRole && user.role !== desiredRole) {
        updates.role = desiredRole;
      }

      if (Object.keys(updates).length > 0) {
        user = await this.usersService.update(user.id, updates);
        updated = true;
      }
    }

    return { user, created, updated };
  }

  async completeRegistration(userId: string, registrationData: any): Promise<User> {
    // Completar el registro del arrendador con los datos del formulario
    return await this.usersService.update(userId, registrationData);
  }
}
