const AWS = require('aws-sdk')

const s3 = new AWS.S3()

// util function to get all objects in s3 input bucket
const listS3 = (params) => {
  return new Promise((resolve, reject) => {
    const out = []
    s3.listObjectsV2(params).promise()
      .then(({ Contents, IsTruncated, NextContinuationToken }) => {
        if (Contents.length)
          out.push(Object.assign(...Contents, { Bucket: params.Bucket }))
        !IsTruncated ? resolve(out) : resolve(listS3(Object.assign(params, { ContinuationToken: NextContinuationToken }), out))
      })
      .catch(reject)
  })
}

exports.listS3 = listS3
