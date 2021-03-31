const AWS = require('aws-sdk')
const moment = require('moment')

const sqs = new AWS.SQS()

const { listS3 } = require('./../utils/listS3/index')

const currentTime = moment(new Date())

module.exports.checkAndEmptyS3 = async (event, context, callback) => {
  console.log('getting objects in buckets')
  // get objects in buckets
  const objects = [...await listS3({ Bucket: process.env.INPUT_BUCKET }), ...await listS3({ Bucket: process.env.OUTPUT_BUCKET })]
  console.log('objects found: ', objects.length)

  // queue objects which were updated more than 3 hours ago for deletion
  const queue = []
  if (objects.length)
    objects.map((object) => {
      if (currentTime.diff(moment(object.LastModified), 'hours') > 3)
        queue.push(sqs.sendMessage({ QueueUrl: process.env.CHECK_S3_QUEUE_URL, MessageBody: JSON.stringify({ bucket: object.Bucket, key: object.Key }) }).promise())
    })

  console.log('objects queued for deletion: ', queue.length)
  // execute queue
  if (queue.length)
    return Promise.all(queue)
}
