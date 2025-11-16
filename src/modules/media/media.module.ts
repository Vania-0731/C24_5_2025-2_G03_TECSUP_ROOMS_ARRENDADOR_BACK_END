import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaFolder } from './entities/media-folder.entity';
import { MediaFile } from './entities/media-file.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaFolder, MediaFile]),
    StorageModule,
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
