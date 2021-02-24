
const { spawnSync } = require('child_process')
const { readFileSync, writeFileSync, unlinkSync } = require('fs')
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

module.exports.trimConcatStash = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const fileName = eventBody.file_name

  if (!fileName) {
    console.log('file name required!')
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'file name required!' })
    }
  }

  const needsTrimming = typeof eventBody.trim_start !== 'undefined' && typeof eventBody.trim_length !== 'undefined'
  let trimOptions = {}
  if (needsTrimming) trimOptions = { start: eventBody.trim_start, length: eventBody.trim_length }

  // get the file
  const Os3Object = await s3
    .getObject({
      Bucket: 'outil-input-audio',
      Key: fileName
    })
    .promise()

  // write file to tmp folder
  writeFileSync(needsTrimming ? '/tmp/original.mp3' : '/tmp/output.mp3', Os3Object.Body)

  if (needsTrimming)
  // crop
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
  if (needsTrimming) unlinkSync('/tmp/original.mp3')
  let resultFile = '/tmp/output.mp3'

  try {
    // check if recording already exists
    const objectExists = await s3.headObject({
      Bucket: 'outil-output-audio',
      Key: fileName
    }).promise()

    if (objectExists) {
      // get the file
      const Pt1s3Object = await s3
        .getObject({
          Bucket: 'outil-output-audio',
          Key: fileName
        })
        .promise()

      // write file to tmp folder
      writeFileSync('/tmp/pt1.mp3', Pt1s3Object.Body)

      // concat with existing recording
      spawnSync(
        '/opt/ffmpeg/ffmpeg',
        [
          '-i',
          '"concat:/tmp/pt1.mp3|/tmp/output.mp3"',
          '-acodec',
          'copy',
                  `/tmp/${fileName}`
        ],
        { stdio: 'inherit' }
      )

      resultFile = `/tmp/${fileName}`

      // delete the temp files
      unlinkSync('/tmp/pt1.mp3')
      unlinkSync('/tmp/output.mp3')

      // delete previous recording from output bucket
      await s3.deleteObject({
        Bucket: 'outil-output-audio',
        Key: fileName
      }).promise()
    }
  } catch (err) {
    console.log('error checking for existing file', err)
  }

  // read file
  const file = readFileSync(resultFile)
  unlinkSync(resultFile)

  // upload new file to s3
  await s3
    .putObject({
      Bucket: 'outil-output-audio',
      Key: fileName,
      Body: file
    })
    .promise()
    .then(async () => {
      // delete original object from input bucket
      await s3.deleteObject({
        Bucket: 'outil-input-audio',
        Key: fileName
      }).promise()

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'success' })
      }
    })
}
