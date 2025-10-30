import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandlordProfile } from './entities/landlord.entity';
import { LandlordsService } from './services/landlords.service';
import { LandlordsController } from './controllers/landlords.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LandlordProfile])],
  controllers: [LandlordsController],
  providers: [LandlordsService],
  exports: [LandlordsService],
})
export class LandlordsModule {}
