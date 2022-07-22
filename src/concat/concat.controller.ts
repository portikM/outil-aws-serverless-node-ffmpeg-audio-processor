import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
} from '@nestjs/common';
import { ConcatService } from './concat.service';
import { MediaTypesEnum } from '../common/enums/media-types.enum';
import { ConcatAudioDto } from './dto/concat-audio.dto';

@Controller('concat')
export class ConcatController {
  constructor(private concatService: ConcatService) {}

  @Post(`/${MediaTypesEnum.AUDIO}`)
  @UsePipes(new ValidationPipe())
  async concatAudioFiles(
    @Body() concatAudioDto: ConcatAudioDto,
  ): Promise<string> {
    return await this.concatService.concatAudioFiles(concatAudioDto);
  }
}
