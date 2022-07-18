import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';
import { TrimService } from './trim/trim.service';
import { TrimController } from './trim/trim.controller';

@Module({
  imports: [InfrastructureModule, ConfigModule.forRoot()],
  controllers: [UploadController, TrimController],
  providers: [UploadService, TrimService],
})
export class AppModule {}
