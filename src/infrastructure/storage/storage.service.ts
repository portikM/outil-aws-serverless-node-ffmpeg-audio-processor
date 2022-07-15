import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export class StorageService {
  private getS3() {
    return new S3();
  }

  async getSignedURL(key: string): Promise<string> {
    const s3 = this.getS3();
    const url = await s3.getSignedUrl('putObject', {
      Bucket: process.env.INPUT_BUCKET,
      Key: key,
    });

    return url;
  }
}
