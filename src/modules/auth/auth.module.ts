import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { AuthTestController } from './controllers/auth-test.controller';
import { DomainValidationService } from './services/domain-validation.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { LandlordsModule } from '../landlords/landlords.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    UsersModule,
    TenantsModule,
    LandlordsModule,
    RolesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, DomainValidationService, GoogleStrategy, JwtStrategy],
  controllers: [AuthController, AuthTestController],
  exports: [AuthService, DomainValidationService],
})
export class AuthModule {}
