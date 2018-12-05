# dotkms

A handy tool for KMS (Key Management System). There is only support for Google Cloud KMS.

You can load option values from .kms file as evironment variables, when you encrypt or decrypt a file. 

## Requirements

* [gcloud](https://cloud.google.com/sdk/gcloud) - A CLI tool for Google Cloud Platform
* Appropiate setup and previleges of Google Cloud KMS. Please see [official documents](https://cloud.google.com/kms/docs/)

## Installing

```bash
$ npm install -g dotkms
   or
$ yarn global add dotkms
```

## Quick start

Before starting, please see "Requirements" section, and install dotkms.

### Create a plain text file that you want to encrypt

```bash
$ echo "MY BIG SECRET" > mysecret.txt
```

### Create a .kms file

```bash
KMS_PROJECT=kms-sandbox # GCP project name
KMS_KEYRING=test-keyring # the name of keyring
KMS_KEY=test-key # the name of key
```

###  Create a keyring and key

If you have already created a keyring and key, skip this section.

```bash
$ dotkms create
```

This command will create a keyring and key as you specified in the .kms file.

### Encrypt the plain text file

```bash
$ dotkms encrypt ./mysecret.txt
```

It will generate a **mysecret.txt.enc** file that is encryped with Google Cloud KMS.

### Decrypt the encrypted file

```bash
$ rm ./mysecret.txt # Remove the secret file before decryption to check
$ dotkms decrypt ./mysecret.txt.enc
```

It will generate **mysecret.txt** file.

## How to load a .kms file

All commands can specify the path of .kms file like:

```bash
$ dotkms encrypt ./mysecret.txt --env ./somewhere/.kms
```
If not passed --env option, **create** command always search the current directory, but **encrypt** and **decrypt** command search the directory that the target file exists, and if cannot find, search the current directory.

For example, if you have these files:

> ```
> /deployment/staging
> ├── .kms
> └── .env.enc
> ```

The below command will load **./deployment/staging/.kms**.

```bash
$ dotkms decrypt ./deployment/staging/.env.enc
```

## More of usage

Please see the help

```bash
$ dotkms --help
$ dotkms encrypt --help
$ dotkms decrypt --help
$ dotkms create --help
```


## License

[MIT](https://en.wikipedia.org/wiki/MIT_License)
