const AWS = require('aws-sdk')

const s3 = new AWS.S3()

const { checkS3 } = require('./../utils/checkS3/index')

module.exports.deleteS3Object = async (event, context) => {
  let object = null
  let invokedFromHttp = false

  if (event.Records)
    object = JSON.parse(event.Records[0].body)
  else {
    const eventBody = JSON.parse(event.body)
    object = { bucket: process.env.OUTPUT_BUCKET, key: eventBody.file_name }
    invokedFromHttp = true
  }

  const { bucket, key } = object

  console.log('checking if object exists in bucket, data: ', object)
  // check if object exists in bucket
  const foundObject = await checkS3(bucket, key)

  let httpResponse = null

  if (foundObject) {
    console.log('deleting object from bucket')
    // delete object from bucket
    await s3.deleteObject({
      Bucket: bucket,
      Key: key
    }).promise()
    if (invokedFromHttp) httpResponse = {
      statusCode: 200,
      body: JSON.stringify({ message: 'success' })
    }
  } else {
    console.log('object not found')
    if (invokedFromHttp) httpResponse = {
      statusCode: 404,
      body: JSON.stringify({ message: 'file not found' })
    }
  }

  if (httpResponse) return httpResponse
}
