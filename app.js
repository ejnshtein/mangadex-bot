require('./env')
const { bot } = require('./core/bot')
require('./commands')(bot)
require('./actions')(bot)
require('./core/feed')(bot)

console.log('bot started')
