import { S3 } from 'aws-sdk';

export interface QueueMessage {
  bucket: string;
  batch: S3.ObjectList;
}
