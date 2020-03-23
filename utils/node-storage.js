const { MTProto } = require('telegram-mtproto')
const { Storage } = require('mtproto-storage-fs')
const readline = require('readline')
const appconfig = require('../config')

// The api_id and api_hash values can be obtained here: https://my.telegram.org/
const config = {
  "phone_number": appconfig.telegram.phone,
  "api_id": parseInt(appconfig.telegram.id,10),
  "api_hash": appconfig.telegram.hash
}

const app = {
  storage: new Storage(appconfig.telegram.storage)
}

const phone = {
  num: config.phone_number
}

const api = {
  layer         : 57,
  initConnection: 0x69796de9,
  api_id        : config.api_id
}

const server = {
  dev: appconfig.telegram.devServer
}

const client  = MTProto({ server, api, app })

// This function will stop execution of the program until you enter the code
// that is sent via SMS or Telegram.
const askForCode = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input : process.stdin,
      output: process.stdout
    })

    rl.question('Please enter passcode for ' + phone.num + ':\n', (num) => {
      rl.close()
      resolve(num)
    })
  })
}

// First you will receive a code via SMS or Telegram, which you have to enter
// directly in the command line. If you entered the correct code, you will be
// logged in and the credentials are saved.
const login = async (client, phone) => {
  const { phone_code_hash } = await client('auth.sendCode', {
    phone_number  : phone.num,
    sms_type: 5,
    current_number: true,
    api_id        : config.api_id,
    api_hash      : config.api_hash
  })

  const phone_code = await askForCode()
  console.log(`Your code: ${phone_code}`)

  const { user } = await client('auth.signIn', {
    phone_number   : phone.num,
    phone_code_hash: phone_code_hash,
    phone_code     : phone_code
  })

  console.log('signed as ', user)
}

const getDialogs = async () => {
  const dialogs = await client('messages.getDialogs', {
    limit: 100,
  })
  console.log('dialogs', dialogs)
}

// First check if we are already signed in (if credentials are stored). If we
// are logged in, execution continues, otherwise the login process begins.
checkLogin = async function() {
	if (!(await app.storage.get('signedin'))) {
    console.log('not signed in')

    try{
      await login(client, phone)
    }catch(err){
      console.error(err);
    }

    console.log('signed in successfully')
		app.storage.set('signedin', true)
	} else {
    console.log('already signed in')
  }
  return
}

module.exports = {
  checkLogin,
}