"use strict";

const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const isGlob = require("is-glob");
const globToRegExp = require("glob-to-regexp");

const Execution = global.ExecutionClass;

class s3Executor extends Execution {
  constructor(process) {
    super(process);
  }

  exec(params) {
    let _this = this;

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
      case "upload":
        _upload(s3, params, _this);
        break;
      case "delete":
        _delete(s3, params, _this);
        break;
      default:
        const endOptions = {
          end: "error",
          messageLog: `S3 method not accepted: ${awsS3Config.method}`,
          err_output: `S3 method not accepted: ${awsS3Config.method}`
        };
        _this.end(endOptions);
    }
  }
}

/**
 * Upload files to s3 bucket
 * @param s3
 * @param params
 * @param executor
 * @private
 */
function _upload(s3, params, executor){
  // call S3 to retrieve upload file to specified bucket
  const uploadParams = {Bucket: params.bucket, Key: "", Body: ""};
  const file_name = params.remote_file || path.basename(params.local_file);

  let fileStream = fs.createReadStream(params.local_file);
  fileStream.on("error", (err) => {
    executor.logger.log("error", "S3 upload reading file Error", params.local_file, err);
  });

  uploadParams.Body = fileStream;
  uploadParams.Key = file_name;

  s3.upload(uploadParams, (err, data) => {
    if (err) {
      const endOptions = {
        end: "error",
        messageLog: `S3 upload file Error: ${err}`,
        err_output: `S3 upload file Error: ${err}`
      };
      executor.end(endOptions);
    }
    else {
      const endOptions = {
        end: "end",
        data_output: data
      };
      executor.end(endOptions);
    }
  });
}

/**
 * Delete files from s3 bucket
 * @param s3
 * @param params
 * @param executor
 * @private
 */
function _delete(S3, params, executor){

  let dirName = "";

  // Check Glob, if exists set dirName
  if (isGlob(params.remote_path)){
    dirName = path.dirname(params.remote_path);

    if (isGlob(dirName)){
      const endOptions = {
        end: "error",
        messageLog: "Glob only applicable to filenames.",
        err_output: "Glob only applicable to filenames.",
      };
      executor.end(endOptions);
    }else{

      // Get files from dirName:
      const listParams = {"Bucket": params.bucket, "Prefix": dirName?dirName:params.remote_path};

      S3.listObjects(listParams, (err, data) => {
        if (err){
          const endOptions = {
            end: "error",
            messageLog: `S3 delete Error: ${err}`,
            err_output: `S3 delete Error: ${err}`
          };
          executor.end(endOptions);
        }else{
          let patternGlob = path.basename(params.remote_path);
          let valRegExp = globToRegExp(patternGlob);
          let matchFiles = [];

          data.Contents.map(file => {
            if (valRegExp.test(file.Key)){
              matchFiles.push(file.Key);
            }
          });

          _deleteS3Async(S3, params.bucket, matchFiles)
            .then(res =>{
              const endOptions = {
                end: "end",
                data_output: res
              };
              executor.end(endOptions);
            })
            .catch(err =>{
              const endOptions = {
                end: "error",
                messageLog: `S3 delete Error: ${err}`,
                err_output: `S3 delete Error: ${err}`
              };
              executor.end(endOptions);
            });
        }
      });

    }
  }else{
    // Delete one file no glob
    _deleteS3Async(S3, params.bucket, params.remote_path)
      .then(res =>{
        const endOptions = {
          end: "end",
          data_output: res
        };
        executor.end(endOptions);
      })
      .catch(err =>{
        const endOptions = {
          end: "error",
          messageLog: `S3 delete Error: ${err}`,
          err_output: `S3 delete Error: ${err}`
        };
        executor.end(endOptions);
      });
  }
}

function _deleteS3Async(s3, bucket, files){
  return new Promise((resolve,reject) => {
    if (files.constructor !== Array){
      files = [files];
    }

    let filesObj = [];
    files.map(file =>{
      filesObj.push({"Key":file});
    });

    if (filesObj.length){
      const deleteParams = {"Bucket": bucket, "Delete": {"Objects":filesObj}};
      s3.deleteObjects(deleteParams, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    }else{
      resolve();
    }
  });
}


module.exports = s3Executor;