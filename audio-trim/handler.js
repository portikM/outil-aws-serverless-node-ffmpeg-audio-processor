const { spawnSync } = require('child_process')
const { readFileSync, writeFileSync, unlinkSync } = require('fs')
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

module.exports.trim = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const fileName = eventBody.file_name

  if (!fileName) {
    console.log('file name required!')
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'file name required!' })
    }
  }

  const trimOptions = { start: eventBody.trim_start, length: eventBody.trim_length }

  try {
    console.log('getting the file')
    // get the file
    const s3Object = await s3
      .getObject({
        Bucket: process.env.OUTPUT_BUCKET,
        Key: fileName
      })
      .promise()

    // write file to tmp folder
    writeFileSync('/tmp/original.mp3', s3Object.Body)

    spawnSync(
      '/opt/ffmpeg/ffmpeg',
      [
        '-ss',
        `${trimOptions.start}`,
        '-t',
        `${trimOptions.length}`,
        '-i',
        '/tmp/original.mp3',
        '-acodec',
        'copy',
        '/tmp/output.mp3'
      ],
      { stdio: 'inherit' }
    )

    // delete the temp files
    unlinkSync('/tmp/original.mp3')

    // read file
    const file = readFileSync('/tmp/output.mp3')
    // delete the temp files
    unlinkSync('/tmp/output.mp3')

    console.log('uploading new file to s3')
    // upload new file to s3
    await s3.putObject({
      Bucket: process.env.OUTPUT_BUCKET,
      Key: fileName,
      Body: file,
      ContentType: 'audio/mpeg',
      ACL: 'public-read'
    }).promise()

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'success', recording_url: `https://${process.env.OUTPUT_BUCKET}.s3.ca-central-1.amazonaws.com/${fileName}` })
    }
  } catch (error) {
    console.log('error ocurred:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    }
  }
}
