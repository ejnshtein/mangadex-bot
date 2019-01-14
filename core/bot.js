// require('dotenv').config({ path: '../.env' })
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const collection = require('./database')
const logger = require('./database/logger')

bot.telegram.getMe()
  .then(botInfo => {
    bot.options.username = botInfo.username
  })

bot.context.db = collection

bot.use(logger())

module.exports = {
  bot
}

bot.startPolling()
