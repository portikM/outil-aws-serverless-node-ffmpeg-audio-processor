import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
const fs = require('fs').promises;

@Injectable()
export class StorageService {
  private getS3() {
    return new S3();
  }

  getSignedURL(mediaType: string, key: string): string {
    const s3 = this.getS3();
    const extension = mediaType === 'audio' ? '.mp3' : '.mp4';
    return s3.getSignedUrl('putObject', {
      Bucket: process.env.INPUT_BUCKET,
      Key: `${mediaType}/${key + extension}`,
    });
  }

  getObject(mediaType: string, key: string) {
    const s3 = this.getS3();
    const extension = mediaType === 'audio' ? '.mp3' : '.mp4';
    return new Promise((resolve, reject) => {
      s3.getObject(
        {
          Bucket: process.env.INPUT_BUCKET as string,
          Key: `${mediaType}/${key + extension}`,
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Body);
          }
        },
      );
    });
  }

  async putObject(mediaType: string, key: string, path: string) {
    const s3 = this.getS3();
    const extension = mediaType === 'audio' ? '.mp3' : '.mp4';
    const body = await fs.readFile(path);
    return new Promise((resolve, reject) => {
      s3.putObject(
        {
          Bucket: process.env.INPUT_BUCKET as string,
          Key: `${mediaType}-output/${key + extension}`,
          Body: body,
          ContentType: 'audio/mpeg',
          ACL: 'public-read',
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      );
    });
  }
}
