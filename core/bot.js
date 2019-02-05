// require('dotenv').config({ path: '../.env' })
const Telegraf = require('telegraf').default
const rateLimit = require('telegraf-ratelimit')
const bot = new Telegraf(process.env.BOT_TOKEN)
const collection = require('./database')
const logger = require('./database/logger')

bot.telegram.getMe()
  .then(botInfo => {
    bot.options.username = botInfo.username
  })

bot.context.db = collection

bot.use(rateLimit({
  window: 2000,
  limit: 3,
  onLimitExceeded: (ctx) => !ctx.inlineQuery ? ctx.reply('Wow, too fast, cowboy. Slow down.') : undefined
}))

bot.use(logger())

module.exports = {
  bot
}

bot.startPolling()
