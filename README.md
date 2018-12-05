# dotkms

A handy tool for KMS (Key Management System). There is only support for Google Cloud KMS.

## Requirements

* [gcloud](https://cloud.google.com/sdk/gcloud)

## Installing

```bash
$ npm install gcloud-kms-cli
```

or 

```bash
$ yarn add gcloud-kms-cli
```

## Usage

Please see the help

```bash
$ gcloud-kms --help
$ gcloud-kms encrypt --help
$ gcloud-kms decrypt --help
```

This will load the variables from the .env file in the current working directory and then run the command (using the new set of environment variables)

## License

[MIT](https://en.wikipedia.org/wiki/MIT_License)
