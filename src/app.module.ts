import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';
import { TrimController } from './trim/trim.controller';
import { TrimService } from './trim/trim.service';
import { ConcatController } from './concat/concat.controller';
import { ConcatService } from './concat/concat.service';
import { ListStorageService } from './list-storage/list-storage.service';

@Module({
  imports: [InfrastructureModule, ConfigModule.forRoot()],
  controllers: [UploadController, TrimController, ConcatController],
  providers: [UploadService, TrimService, ConcatService, ListStorageService],
})
export class AppModule {}
