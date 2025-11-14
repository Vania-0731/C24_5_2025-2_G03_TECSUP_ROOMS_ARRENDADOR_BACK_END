import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { LandlordsModule } from './modules/landlords/landlords.module';
import { ChatModule } from './modules/chat/chat.module';
import { RequestsModule } from './modules/requests/requests.module';
import { StorageModule } from './modules/storage/storage.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    TenantsModule,
    LandlordsModule,
    ChatModule,
    RequestsModule,
    StorageModule,
    MediaModule,
  ],
})
export class AppModule {}
