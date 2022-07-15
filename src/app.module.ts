import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';

@Module({
  imports: [InfrastructureModule, ConfigModule.forRoot()],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
