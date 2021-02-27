const AWS = require('aws-sdk')

const sqs = new AWS.SQS()

module.exports.queueS3Object = async (event, context) => {
  if (event.Records === null) {
    console.log('error: event has no records')
    return
  }

  const objectData = { bucket: process.env.OUTPUT_BUCKET, key: event.Records[0].s3.object.key }

  console.log('posting message to queue')
  // post message to queue
  const queueObject = sqs.sendMessage({ QueueUrl: process.env.CHECK_S3_QUEUE_URL, MessageBody: JSON.stringify({ bucket: objectData.bucket, key: objectData.key }), DelaySeconds: 10800 }).promise()
  return queueObject
}
