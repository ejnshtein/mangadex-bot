// require('dotenv').config({ path: '../.env' })
import Telegraf from 'telegraf-esm'
import collection from './database/index.js'
import logger from './database/logger.js'
export const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.getMe()
  .then(botInfo => {
    bot.options.username = botInfo.username
  })

bot.context.db = collection

// bot.use(
//   rateLimit({
//     window: 2000,
//     limit: 3,
//     onLimitExceeded: (ctx) => !ctx.inlineQuery ? ctx.reply('Wow, too fast, cowboy. Slow down.') : undefined
//   })
// )

bot.use(logger())

// bot.use((ctx, next) => {
//   console.log(ctx)
//   next()
// })

bot.startPolling()
