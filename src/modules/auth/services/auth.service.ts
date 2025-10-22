import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { DomainValidationService, UserType } from './domain-validation.service';
import { User } from '../../users/entities/user.entity';

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

  async completeRegistration(userId: string, registrationData: any): Promise<User> {
    // Completar el registro del arrendador con los datos del formulario
    return await this.usersService.update(userId, registrationData);
  }
}
