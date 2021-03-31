const AWS = require('aws-sdk')
const s3 = new AWS.S3()

module.exports.getSignedUrl = async event => {
  const eventParams = event.queryStringParameters
  const fileName = eventParams.file_name

  if (!fileName)
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'file name is required!'
      })
    }

  try {
    console.log('issuing signed url')
    // issue signed url
    const url = await s3.getSignedUrl('putObject', {
      Bucket: process.env.INPUT_BUCKET,
      Key: fileName,
      ACL: 'public-read'
    })

    return {
      statusCode: 200,
      body: JSON.stringify(url)
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  }
}
