import { Injectable } from '@nestjs/common';
import { StorageService } from '../infrastructure/storage/storage.service';
import { MediaTypesEnum } from '../common/enums/media-types.enum';
import { S3 } from 'aws-sdk';
import * as moment from 'moment';
import { QueueService } from '../infrastructure/queue/queue.service';

const { INPUT_BUCKET = '', OUTPUT_BUCKET = '' } = process.env;
const currentTime = moment(new Date());

@Injectable()
export class ListStorageService {
  constructor(
    private storageService: StorageService,
    private queueService: QueueService,
  ) {}

  async listStorage(): Promise<void> {
    // find stale objects in the input bucket
    const staleInputObjects = await this.getStaleObjects(
      INPUT_BUCKET,
      MediaTypesEnum.AUDIO,
    );

    for (let i = 0; i < staleInputObjects.length; i += 10) {
      const batch = staleInputObjects.slice(i, i + 10);

      await this.queueService.postMessage({
        bucket: INPUT_BUCKET,
        batch,
      });
    }

    // find stale objects in the output bucket
    const staleOutputObjects = await this.getStaleObjects(
      OUTPUT_BUCKET,
      MediaTypesEnum.AUDIO,
    );

    for (let i = 0; i < staleOutputObjects.length; i += 10) {
      const batch = staleOutputObjects.slice(i, i + 10);

      await this.queueService.postMessage({
        bucket: INPUT_BUCKET,
        batch,
      });
    }
  }

  private async getStaleObjects(
    bucket: string,
    mediaType: string,
  ): Promise<S3.ObjectList> {
    const objectList = await this.storageService.listObjects(bucket, mediaType);

    const { KeyCount = 0, Contents = [] } = objectList;
    if (KeyCount > 0) {
      return Contents.filter(
        ({ LastModified = '' }) =>
          currentTime.diff(moment(LastModified), 'hours') > 24,
      );
    }

    return [];
  }
}
