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
import { S3NotFoundException } from '../common/s3-not-found.exception';

const { OUTPUT_BUCKET = '' } = process.env;

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
      if (error instanceof S3NotFoundException) {
        throw new NotFoundException('Audio file not found');
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'Error getting audio file from storage',
        );
      }
    }

    // save file to temp folder
    await fs.writeFile('/tmp/unencoded.mp3', file as Buffer);

    // encode audio file
    spawnSync(
      '/opt/bin/ffmpeg',
      [
        '-i',
        '/tmp/unencoded.mp3',
        '-acodec',
        'libmp3lame',
        '-ar',
        '44100',
        '-y',
        `/tmp/${trimAudioDto.key}.mp3`,
      ],
      {
        stdio: 'inherit',
      },
    );

    // if file needs to be trimmed, trim it.. (c) Jason Statham
    let outputFile = `/tmp/${trimAudioDto.key}.mp3`;
    const needsTrimming =
      trimAudioDto.trimStart !== undefined &&
      trimAudioDto.trimLength !== undefined;
    if (needsTrimming) {
      outputFile = '/tmp/trimmed.mp3';

      spawnSync(
        '/opt/bin/ffmpeg',
        [
          '-ss',
          `${trimAudioDto.trimStart}`,
          '-t',
          `${trimAudioDto.trimLength}`,
          '-i',
          `/tmp/${trimAudioDto.key}.mp3`,
          '-y',
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

    return `https://${OUTPUT_BUCKET}.s3.ca-central-1.amazonaws.com/audio/${trimAudioDto.key}.mp3`;
  }
}
