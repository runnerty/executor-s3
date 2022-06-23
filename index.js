'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const isGlob = require('is-glob');
const globToRegExp = require('glob-to-regexp');

const Executor = require('@runnerty/module-core').Executor;

class s3Executor extends Executor {
  constructor(process) {
    super(process);
  }

  exec(params) {
    if (!params.bucket) {
      const endOptions = {
        end: 'error',
        messageLog: 'S3 bucket is not defined.',
        err_output: 'S3 bucket is not defined.'
      };
      this.end(endOptions);
    } else {
      const awsS3Config = {
        apiVersion: params.apiVersion,
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
        bucket: params.bucket,
        method: params.method,
        region: params.region
      };

      const s3 = new AWS.S3(awsS3Config);

      switch (params.method) {
        case 'upload':
          this.upload(s3, params);
          break;
        case 'delete':
          this.delete(s3, params);
          break;
        case 'download':
          this.download(s3, params);
          break;
        default:
          const endOptions = {
            end: 'error',
            messageLog: `S3 method not accepted: ${awsS3Config.method}`,
            err_output: `S3 method not accepted: ${awsS3Config.method}`
          };
          this.end(endOptions);
      }
    }
  }

  upload(s3, params) {
    // call S3 to retrieve upload file to specified bucket
    const fileStream = fs.createReadStream(params.local_file);
    fileStream.on('error', err => {
      this.logger.log('error', 'S3 upload error reading local file', params.local_file, err);
    });

    const uploadParams = {
      Bucket: params.bucket,
      Key: params.remote_file,
      Body: fileStream,
      ACL: params?.ACL || undefined,
      ContentType: params?.ContentType || undefined
    };

    s3.upload(uploadParams, (err, data) => {
      if (err) {
        const endOptions = {
          end: 'error',
          messageLog: `S3 upload file Error: ${err}`,
          err_output: `S3 upload file Error: ${err}`
        };
        this.end(endOptions);
      } else {
        const endOptions = {
          end: 'end',
          data_output: data
        };
        this.end(endOptions);
      }
    });
  }

  delete(S3, params) {
    let dirName = '';

    // Check Glob, if exists set dirName
    if (isGlob(params.remote_path)) {
      dirName = path.dirname(params.remote_path);

      if (isGlob(dirName)) {
        const endOptions = {
          end: 'error',
          messageLog: 'Glob only applicable to filenames.',
          err_output: 'Glob only applicable to filenames.'
        };
        this.end(endOptions);
      } else {
        // Get files from dirName:
        const listParams = { Bucket: params.bucket, Prefix: dirName ? dirName : params.remote_path };
        S3.listObjects(listParams, (err, data) => {
          if (err) {
            const endOptions = {
              end: 'error',
              messageLog: `S3 delete Error: ${err}`,
              err_output: `S3 delete Error: ${err}`
            };
            this.end(endOptions);
          } else {
            const patternGlob = path.basename(params.remote_path);
            const valRegExp = globToRegExp(patternGlob);
            const matchFiles = [];

            data.Contents.map(file => {
              if (valRegExp.test(file.Key)) {
                matchFiles.push(file.Key);
              }
            });

            this.deleteS3Async(S3, params.bucket, matchFiles)
              .then(res => {
                const endOptions = {
                  end: 'end',
                  data_output: res
                };
                this.end(endOptions);
              })
              .catch(err => {
                const endOptions = {
                  end: 'error',
                  messageLog: `S3 delete Error: ${err}`,
                  err_output: `S3 delete Error: ${err}`
                };
                this.end(endOptions);
              });
          }
        });
      }
    } else {
      // Delete one file no glob
      this.deleteS3Async(S3, params.bucket, params.remote_path)
        .then(res => {
          const endOptions = {
            end: 'end',
            data_output: res
          };
          this.end(endOptions);
        })
        .catch(err => {
          const endOptions = {
            end: 'error',
            messageLog: `S3 delete Error: ${err}`,
            err_output: `S3 delete Error: ${err}`
          };
          this.end(endOptions);
        });
    }
  }

  deleteS3Async(s3, bucket, files) {
    return new Promise((resolve, reject) => {
      if (files.constructor !== Array) {
        files = [files];
      }

      const filesObj = [];
      files.map(file => {
        filesObj.push({ Key: file });
      });

      if (filesObj.length) {
        const deleteParams = { Bucket: bucket, Delete: { Objects: filesObj } };
        s3.deleteObjects(deleteParams, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } else {
        resolve();
      }
    });
  }

  download(s3, params) {
    const fileStream = fs.createWriteStream(params.local_file);
    const s3Stream = s3.getObject({ Bucket: params.bucket, Key: params.remote_file }).createReadStream();

    // Listen for errors returned by the service
    s3Stream.on('error', err => {
      // NoSuchKey: The specified key does not exist
      const endOptions = {
        end: 'error',
        messageLog: `S3 download file Error: ${err}`,
        err_output: `S3 download file Error: ${err}`
      };
      this.end(endOptions);
    });

    s3Stream
      .pipe(fileStream)
      .on('error', err => {
        // capture any errors that occur when writing data to the file
        const endOptions = {
          end: 'error',
          messageLog: `S3 download file Error: ${err}`,
          err_output: `S3 download file Error: ${err}`
        };
        this.end(endOptions);
      })
      .on('close', () => {
        const endOptions = {
          end: 'end'
        };
        this.end(endOptions);
      });
  }
}

module.exports = s3Executor;
