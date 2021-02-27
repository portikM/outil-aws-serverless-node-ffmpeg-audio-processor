const AWS = require('aws-sdk')

const s3 = new AWS.S3()

// util function to check whether object exists in s3 bucket
const checkS3 = (bucket, key) => {
  return new Promise((resolve, reject) => {
    s3.headObject({ Bucket: bucket, Key: key }, (err, metadata) => {
      if (err && ['NotFound', 'Forbidden'].indexOf(err.code) > -1) return resolve()
      else if (err)
        return reject(err)

      return resolve(metadata)
    })
  })
}

exports.checkS3 = checkS3
