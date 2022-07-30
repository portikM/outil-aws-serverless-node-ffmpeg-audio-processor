import { Injectable } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { QueueMessage } from './interfaces/queue-message.interface';

const { DELETE_OBJECTS_FROM_S3_QUEUE_URL = '' } = process.env;

@Injectable()
export class QueueService {
  private getSQS() {
    return new SQS();
  }

  async postMessage(messageBody: QueueMessage): Promise<void> {
    const sqs = this.getSQS();
    return new Promise((resolve, reject) => {
      sqs.sendMessage(
        {
          QueueUrl: DELETE_OBJECTS_FROM_S3_QUEUE_URL,
          MessageBody: JSON.stringify(messageBody),
        },
        (err, _data) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }
}
