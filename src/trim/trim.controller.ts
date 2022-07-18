import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
} from '@nestjs/common';
import { TrimService } from './trim.service';
import { MediaTypesEnum } from '../common/enums/media-types.enum';
import { TrimAudioDto } from './dto/trim-audio.dto';

@Controller('trim')
export class TrimController {
  constructor(private trimService: TrimService) {}

  @Post(`/${MediaTypesEnum.AUDIO}`)
  @UsePipes(new ValidationPipe())
  async trimAudio(@Body() trimAudioDto: TrimAudioDto): Promise<string> {
    return await this.trimService.trimAudio(trimAudioDto);
  }
}
