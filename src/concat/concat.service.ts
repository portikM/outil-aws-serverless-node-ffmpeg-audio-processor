/* eslint-disable @typescript-eslint/no-var-requires */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { StorageService } from '../infrastructure/storage/storage.service';
import { ConcatAudioDto } from './dto/concat-audio.dto';
import { MediaTypesEnum } from '../common/enums/media-types.enum';
import { promises as fs } from 'fs';
const { spawnSync } = require('child_process');
import { S3NotFoundException } from '../common/s3-not-found.exception';

@Injectable()
export class ConcatService {
  constructor(private storageService: StorageService) {}

  async concatAudioFiles(concatAudioDto: ConcatAudioDto): Promise<string> {
    // get part 1 audio file from storage
    let pt1;
    try {
      pt1 = await this.storageService.getObject(
        MediaTypesEnum.AUDIO,
        concatAudioDto.key,
        process.env.OUTPUT_BUCKET as string,
      );
    } catch (error) {
      if (error instanceof S3NotFoundException) {
        throw new NotFoundException('Audio file (1) not found');
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'Error getting audio file (1) from storage',
        );
      }
    }

    // save part 1 file to temp folder
    // part 1 files doesn't need to be encoded because it was already encoded in trim service
    await fs.writeFile('/tmp/pt1.mp3', pt1 as Buffer);

    // get part 2 audio file from storage
    let pt2;
    try {
      pt2 = await this.storageService.getObject(
        MediaTypesEnum.AUDIO,
        concatAudioDto.key,
      );
    } catch (error) {
      if (error instanceof S3NotFoundException) {
        throw new NotFoundException('Audio file (2) not found');
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'Error getting audio file (2) from storage',
        );
      }
    }

    // save part 2 file to temp folder
    await fs.writeFile('/tmp/pt2-unencoded.mp3', pt2 as Buffer);

    // encode part 2 file
    spawnSync(
      '/opt/bin/ffmpeg',
      [
        '-i',
        '/tmp/pt2-unencoded.mp3',
        '-acodec',
        'libmp3lame',
        '-ar',
        '44100',
        '-y',
        '/tmp/pt2.mp3',
      ],
      {
        stdio: 'inherit',
      },
    );

    // create list of files to concat
    await fs.writeFile(
      '/tmp/list.txt',
      "file '/tmp/pt1.mp3'\r\nfile '/tmp/pt2.mp3'",
    );

    // concat files
    spawnSync(
      '/opt/bin/ffmpeg',
      [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        '/tmp/list.txt',
        '-y',
        `/tmp/${concatAudioDto.key}.mp3`,
      ],
      { stdio: 'inherit' },
    );

    // upload audio file to storage
    await this.storageService.putObject(
      MediaTypesEnum.AUDIO,
      concatAudioDto.key,
      `/tmp/${concatAudioDto.key}.mp3`,
    );

    return `https://${process.env.OUTPUT_BUCKET}.s3.ca-central-1.amazonaws.com/audio/${concatAudioDto.key}.mp3`;
  }
}
