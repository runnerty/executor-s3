<p align="center">
  <a href="http://runnerty.io">
    <img height="257" src="https://runnerty.io/assets/header/logo-stroked.png">
  </a>
  <p align="center">Smart Processes Management</p>
</p>

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Dependency Status][david-badge]][david-badge-url]
<a href="#badge">
<img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg">
</a>

# S3 executor for [Runnerty]:

### Installation:

Through NPM

```bash
npm i @runnerty/executor-s3
```

You can also add modules to your project with [runnerty-cli]

```bash
npx runnerty-cli add @runnerty/executor-s3
```

This command installs the module in your project, adds example configuration in your `config.json` and creates an example plan of use.

If you have installed [runnerty-cli] globally you can include the module with this command:

```bash
rty add @runnerty/executor-s3
```

### Configuration sample:

Add in [config.json]:

```json
{
  "id": "s3_default",
  "type": "@runnerty-executor-s3",
  "apiVersion": "2006-03-01",
  "accessKeyId": "ABC123",
  "secretAccessKey": "ABC123",
  "region": "eu-west-1",
  "bucket": "my.s3bucket.com"
}
```

### Plan samples:

Add in [plan.json]:

- Upload

```json
{
  "id": "s3_default",
  "method": "upload",
  "local_file": "/tmp/test.txt",
  "remote_file": "dir_one/dir_two/test_up.txt"
}
```

- Download

```json
{
  "id": "s3_default",
  "method": "download",
  "remote_file": "test.txt",
  "local_file": "/tmp/test_down.txt"
}
```

- Delete

```json
{
  "id": "s3_default",
  "method": "delete",
  "remote_path": "folder_test/foo.txt"
}
```

- Delete array of files

```json
{
  "id": "s3_default",
  "method": "delete",
  "remote_path": ["folder_test/sample.txt", "folder_test/sample.zip"]
}
```

- Delete glob pattern

```json
{
  "id": "s3_default",
  "method": "delete",
  "remote_path": "folder_test/*.txt"
}
```

[runnerty]: http://www.runnerty.io
[downloads-image]: https://img.shields.io/npm/dm/@runnerty/executor-s3.svg
[npm-url]: https://www.npmjs.com/package/@runnerty/executor-s3
[npm-image]: https://img.shields.io/npm/v/@runnerty/executor-s3.svg
[david-badge]: https://david-dm.org/runnerty/executor-s3.svg
[david-badge-url]: https://david-dm.org/runnerty/executor-s3
[config.json]: http://docs.runnerty.io/config/
[plan.json]: http://docs.runnerty.io/plan/
[runnerty-cli]: https://www.npmjs.com/package/runnerty-cli
