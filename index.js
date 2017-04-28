"use strict";

var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');

var Execution = global.ExecutionClass;

class s3Executor extends Execution {
  constructor(process) {
    super(process);
  }

  exec(params) {
    var _this = this;

    var awsS3Config = {
      apiVersion: params.apiVersion,
      accessKeyId: params.accessKeyId,
      secretAccessKey: params.secretAccessKey,
      bucket: params.bucket,
      method: params.method,
      region: params.region
    };

    var s3 = new AWS.S3(awsS3Config);

    if (params.method === 'upload') {

      // call S3 to retrieve upload file to specified bucket
      var uploadParams = {Bucket: params.bucket, Key: '', Body: ''};
      var file_name = params.remote_file || path.basename(params.local_file);

      var fileStream = fs.createReadStream(params.local_file);
      fileStream.on('error', function (err) {
        _this.logger.log('error', 'S3 upload reading file Error', params.local_file, err);
      });

      uploadParams.Body = fileStream;
      uploadParams.Key = file_name;

      s3.upload(uploadParams, function (err, data) {
        if (err) {
          var endOptions = {
            end: 'error',
            messageLog: `S3 upload file Error: ${err}`,
            execute_err_return: `S3 upload file Error: ${err}`
          };
          _this.end(endOptions);
        }
        else {
          var endOptions = {
            end: 'end',
            execute_return: JSON.stringify(data)
          };
          _this.end(endOptions);
        }
      });
    } else {
      var endOptions = {
        end: 'error',
        messageLog: `S3 method not accepted: ${method}`,
        execute_err_return: `S3 method not accepted: ${method}`
      };
      _this.end(endOptions);
    }
  }
}

module.exports = s3Executor;