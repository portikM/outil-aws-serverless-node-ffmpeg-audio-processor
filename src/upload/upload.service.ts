import { Injectable } from '@nestjs/common';
import { StorageService } from '../infrastructure/storage/storage.service';
import { GetUploadUrlDto } from './dto/get-upload-url-dto.dto';

@Injectable()
export class UploadService {
  constructor(private storageService: StorageService) {}

  getUploadUrl(getUploadUrlDto: GetUploadUrlDto): string {
    return this.storageService.getSignedURL(
      getUploadUrlDto.mediaType,
      getUploadUrlDto.key,
    );
  }
}
