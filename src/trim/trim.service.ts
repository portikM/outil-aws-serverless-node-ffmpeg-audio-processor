/* eslint-disable @typescript-eslint/no-var-requires */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { StorageService } from '../infrastructure/storage/storage.service';
import { TrimAudioDto } from './dto/trim-audio.dto';
import { MediaTypesEnum } from '../common/enums/media-types.enum';
const fs = require('fs').promises;

@Injectable()
export class TrimService {
  constructor(private storageService: StorageService) {}

  async trimAudio(trimAudioDto: TrimAudioDto): Promise<string> {
    // get the audio file from the storage
    let file;
    try {
      file = await this.storageService.getObject(
        MediaTypesEnum.AUDIO,
        trimAudioDto.key,
      );
    } catch (error) {
      if (error.statusCode && error.statusCode === 404) {
        throw new NotFoundException('Audio file not found');
      } else {
        throw new InternalServerErrorException(
          'Error getting audio file from storage',
        );
      }
    }

    // save file to temp folder
    await fs.writeFile('/tmp/original.mp3', file);

    // TODO: trim the audio file and save to storage

    return '';
  }
}
