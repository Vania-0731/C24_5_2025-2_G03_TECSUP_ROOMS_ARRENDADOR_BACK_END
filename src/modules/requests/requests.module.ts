import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsService } from './services/requests.service';
import { RequestsController } from './controllers/requests.controller';
import { Request } from './entities/request.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [TypeOrmModule.forFeature([Request]), TenantsModule, ActivitiesModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
