import { Module } from '@nestjs/common';
import { StorageService } from './storage/storage.service';
import { QueueService } from './queue/queue.service';

@Module({
  providers: [StorageService, QueueService],
  exports: [StorageService, QueueService],
})
export class InfrastructureModule {}
