import {
  Controller,
  Get,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { GetUploadUrlDto } from './dto/get-upload-url-dto.dto';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Get()
  @UsePipes(new ValidationPipe())
  async getUploadUrl(
    @Query() getUploadUrlDto: GetUploadUrlDto,
  ): Promise<string> {
    return await this.uploadService.getUploadUrl(getUploadUrlDto);
  }
}
