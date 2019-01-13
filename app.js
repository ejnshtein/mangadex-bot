require('dotenv').config({ path: './.env' })
const { bot } = require('./core/bot')
require('./commands')(bot)
require('./actions')(bot)

console.log('bot started')
