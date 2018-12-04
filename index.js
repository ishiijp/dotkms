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
const camelCase = require('lodash.camelcase')

program.version(pkg.version, '-v, --version')
function cryptCommand(command) {
  return program
    .command(command)
    .option('--prefix <prefix>', 'Prefix of environment variables.')
    .option('-g, --project <project>', 'Google Cloud project to use. GCLOUD_KMS_PROJECT')
    .option('-l, --location <location>', 'Location of the keyring. GCLOUD_KMS_LOCATION')
    .option('-k, --key <key>', 'The key to use for encryption. GCLOUD_KMS_KEY')
    .option('-r, --keyring <keyring>', 'Key ring of the key. GCLOUD_KMS_KEYRING')
    .option('-v, --version <version>', 'Version to use for encryption. GCLOUD_KMS_VERSION')
    .option('-p, --plaintext-file <file>', 'File path of the plaintext file to encrypt. GCLOUD_KMS_PLAINTEXT_FILE')
    .option('-c, --ciphertext-file <file>', 'File path of the ciphertext file to output. GCLOUD_KMS_CIPHERTEXT_FILE')
    .option('-x, --ciphertext-file-extension <extension>', 'Extension of the ciphertext file (Default is "enc"). GCLOUD_KMS_CIPHERTEXT_FILE_EXTENSION')
}

function cryptOptions(cmd) {
  if (typeof cmd.version === 'function') {
    cmd.version = undefined
  }
  const opts = {}
  const optNames = cmd.options
    .map(op => op.long.replace(/^--/, ''))
    .filter(optName => optName != 'prefix')


  const envPrefix = cmd.prefix || 'GCLOUD_KMS'

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
  execSync(gcloudCommand)
  if (switchProject) {
    console.info(`Reverse project from ${opts.project} to ${currentProject}`)
    execSync(`gcloud config set project ${currentProject}`)
  }
}

const GCLOUD_CRYPT_OPTIONS = [
  'location',
  'key',
  'keyring',
  'plaintext-file',
  'ciphertext-file',
  'version'
]

cryptCommand('encrypt')
.action(cmd => {
  const opts = cryptOptions(cmd)
  if (!opts['ciphertext-file'] && opts['plaintext-file']) {
    const ciphertextFileExtension = opts['ciphertext-file-extension'] || 'enc'
    opts['ciphertext-file'] = `${opts['plaintext-file']}.${ciphertextFileExtension}`
  }
  execCrypt('encrypt', opts)
})

cryptCommand('decrypt')
.action(cmd => {
  const opts = cryptOptions(cmd)  
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
