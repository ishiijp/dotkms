#!/usr/bin/env node

execSync = require('child_process').execSync
try {
  execSync('command -v gcloud')
} catch(e) {
  console.error('Please install gcloud command.')
  process.exit()
}

const program = require('commander')
const pkg = require('./package.json')
const dotenv = require('dotenv')
const camelCase = require('lodash.camelcase')
const path = require('path')
const fs = require('fs')

program.version(pkg.version, '-v, --version')
function cryptCommand(command) {
  return program
    .command(command)
    .option('--prefix <prefix>', 'Prefix of environment variables.')
    .option('-n, --env <file>', 'Path of env file.')
    .option('-g, --project <project>', 'Google Cloud project to use. KMS_PROJECT')
    .option('-l, --location <location>', 'Location of the keyring. KMS_LOCATION')
    .option('-k, --key <key>', 'The key to use for encryption. KMS_KEY')
    .option('-r, --keyring <keyring>', 'Key ring of the key. KMS_KEYRING')
    .option('-v, --version <version>', 'Version to use for encryption. KMS_VERSION')
    .option('-p, --plaintext-file <file>', 'File path of the plaintext file to encrypt. KMS_PLAINTEXT_FILE')
    .option('-c, --ciphertext-file <file>', 'File path of the ciphertext file to output. KMS_CIPHERTEXT_FILE')
    .option('-x, --ciphertext-file-extension <extension>', 'Extension of the ciphertext file (Default is "enc"). KMS_CIPHERTEXT_FILE_EXTENSION')
}

function cryptOptions(cmd) {
  if (typeof cmd.version === 'function') {
    cmd.version = undefined
  }
  const opts = {}
  const optNames = cmd.options
    .map(op => op.long.replace(/^--/, ''))
    .filter(optName => !['prefix, env'].includes(optName))

  const envPrefix = cmd.prefix || 'KMS'

  optNames.forEach(optName => {
    const envName = envPrefix + '_' + optName.replace(/-/g, '_').toUpperCase()
    opts[optName] = cmd[camelCase(optName)] || process.env[envName]
  })
  return opts
}

function execCrypt(cmd, opts) {
  const gcloutOpts = GCLOUD_CRYPT_OPTIONS.map(optName => {
    return opts[optName] ? `--${optName} ${opts[optName]}` : ''
  }).join(' ')

  const gcloudCommand = `gcloud kms ${cmd} ${gcloutOpts}`

  const currentProject = execSync('gcloud config get-value project').toString().trim()
  const switchProject = opts.project && opts.project != currentProject

  if (switchProject) {
    console.info(`Switch project from ${currentProject} to ${opts.project}`)
    execSync(`gcloud config set project ${opts.project}`)
  }
  console.info(`Executing gcloud command: ${gcloudCommand}`)
  execSync(gcloudCommand)
  if (switchProject) {
    console.info(`Reverse project from ${opts.project} to ${currentProject}`)
    execSync(`gcloud config set project ${currentProject}`)
  }
}

function loadEnv(targetFile, cmd) {
  if (cmd.env) {
    dotenv.config({ path: cmd.env }) 
    return
  } else if (targetFile) {
    const dotKms = path.dirname(path.resolve(targetFile)) + '/.kms'
    try {
      fs.accessSync(dotKms)
      dotenv.config({ path: dotKms }) 
      return
    } catch(e) {
      // thru
    }
  }
  dotenv.config({ path: '.kms' })
}

const GCLOUD_CRYPT_OPTIONS = [
  'location',
  'key',
  'keyring',
  'plaintext-file',
  'ciphertext-file',
  'version'
]

cryptCommand('encrypt [plaintext-file]')
.action((plaintextFile, cmd) => {
  loadEnv(plaintextFile, cmd)
  const opts = cryptOptions(cmd)
  if (plaintextFile) {
    opts['plaintext-file'] = plaintextFile
  }
  if (!opts['ciphertext-file'] && opts['plaintext-file']) {
    const ciphertextFileExtension = opts['ciphertext-file-extension'] || 'enc'
    opts['ciphertext-file'] = `${opts['plaintext-file']}.${ciphertextFileExtension}`
  }
  execCrypt('encrypt', opts)
})

cryptCommand('decrypt [ciphertext-file]')
.action((ciphertextFile, cmd) => {
  loadEnv(ciphertextFile, cmd)
  const opts = cryptOptions(cmd)  
  if (ciphertextFile) {
    opts['ciphertext-file'] = ciphertextFile
  }
  if (!opts['plaintext-file'] && opts['ciphertext-file']) {
    const ciphertextFileExtension = opts['ciphertext-file-extension'] || 'enc'
    const plaintextFile = opts['ciphertext-file'].replace(new RegExp('\.' + ciphertextFileExtension + '$'), '')
    if (plaintextFile != opts['ciphertext-file']) {
      opts['plaintext-file'] = plaintextFile
    }
  }
  execCrypt('decrypt', opts)
})

program.parse(process.argv)
