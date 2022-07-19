/* eslint-disable @typescript-eslint/no-var-requires */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { StorageService } from '../infrastructure/storage/storage.service';
import { TrimAudioDto } from './dto/trim-audio.dto';
import { MediaTypesEnum } from '../common/enums/media-types.enum';
import { promises as fs } from 'fs';
const { spawnSync } = require('child_process');

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
        console.log(error);
        throw new InternalServerErrorException(
          'Error getting audio file from storage',
        );
      }
    }

    // save file to temp folder
    await fs.writeFile(`/tmp/${trimAudioDto.key}.mp3`, file as Buffer);

    // if file needs to be trimmed, trim it.. (c) Jason Statham
    let outputFile = `/tmp/${trimAudioDto.key}.mp3`;
    const needsTrimming =
      trimAudioDto.trimStart !== undefined &&
      trimAudioDto.trimLength !== undefined;
    if (needsTrimming) {
      outputFile = '/tmp/output.mp3';

      spawnSync(
        '/opt/bin/ffmpeg',
        [
          '-ss',
          `${trimAudioDto.trimStart}`,
          '-t',
          `${trimAudioDto.trimLength}`,
          '-i',
          `/tmp/${trimAudioDto.key}.mp3`,
          '-acodec',
          'copy',
          outputFile,
        ],
        { stdio: 'inherit' },
      );
    }

    // upload audio file to storage
    await this.storageService.putObject(
      MediaTypesEnum.AUDIO,
      trimAudioDto.key,
      outputFile,
    );

    return `https://${process.env.OUTPUT_BUCKET}.s3.ca-central-1.amazonaws.com/audio/${trimAudioDto.key}.mp3`;
  }
}
