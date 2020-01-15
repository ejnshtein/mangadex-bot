import Telegraf from 'telegraf-esm'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.command('getid', ({ from, chat, reply }) =>
  reply(`Your id: <code>${from.id}</code>\nChat id: <code>${chat.id}</code>`, {
    parse_mode: 'HTML'
  })
)

bot.use(composer.middleware())
