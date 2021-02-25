const { spawnSync } = require('child_process')
const { readFileSync, writeFileSync, unlinkSync, writeFile } = require('fs')
const AWS = require('aws-sdk')
const { promisify } = require('util')

const s3 = new AWS.S3()
const asyncWriteFile = promisify(writeFile)

function checkS3 (key) {
  return new Promise((resolve, reject) => {
    s3.headObject({ Bucket: process.env.OUTPUT_BUCKET, Key: key }, (err, metadata) => {
      if (err && ['NotFound', 'Forbidden'].indexOf(err.code) > -1) return resolve()
      else if (err)
        return reject(err)

      return resolve(metadata)
    })
  })
}

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

  console.log('getting the file')
  // get the file
  const s3Object = await s3
    .getObject({
      Bucket: process.env.INPUT_BUCKET,
      Key: fileName
    })
    .promise()

  // write file to tmp folder
  writeFileSync(needsTrimming ? '/tmp/original.mp3' : '/tmp/output.mp3', s3Object.Body)

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

  let resultFilePath = '/tmp/output.mp3'

  // check if recording already exists
  const needsConcat = await checkS3(fileName)

  if (needsConcat) {
    console.log('getting pt1 file')
    // get pt1 file
    const Pt1s3Object = await s3
      .getObject({
        Bucket: process.env.OUTPUT_BUCKET,
        Key: fileName
      })
      .promise()

    // write file to tmp folder
    writeFileSync('/tmp/pt1.mp3', Pt1s3Object.Body)

    console.log('creating txt file')
    // create txt file
    await asyncWriteFile('/tmp/list.txt', 'file \'/tmp/pt1.mp3\'\r\nfile \'/tmp/output.mp3\'', (err) => {
      if (err)
        console.log(err)
    })

    // concat
    spawnSync(
      '/opt/ffmpeg/ffmpeg',
      [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        '/tmp/list.txt',
        '-c',
        'copy',
                  `/tmp/${fileName}`
      ],
      { stdio: 'inherit' }
    )

    resultFilePath = `/tmp/${fileName}`

    console.log('deleting the temp files')
    // delete the temp files
    unlinkSync('/tmp/pt1.mp3')
    unlinkSync('/tmp/output.mp3')
  }

  // read file
  const file = readFileSync(resultFilePath)
  // delete the temp files
  unlinkSync(resultFilePath)

  console.log('uploading new file to s3')
  // upload new file to s3
  await s3.putObject({
    Bucket: process.env.OUTPUT_BUCKET,
    Key: fileName,
    Body: file
  }).promise()

  console.log('deleting original object from input bucket (wip)')
  // delete original object from input bucket
  await s3.deleteObject({
    Bucket: process.env.INPUT_BUCKET,
    Key: fileName
  }).promise()

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'success' })
  }
}
