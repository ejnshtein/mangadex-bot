import { Composer } from 'telegraf'
import { bot } from '../bot.js'
import { TelegrafContext } from '../types/telegraf'

const composer = new Composer()

composer.start(
  Composer.privateChat(
    async (ctx: TelegrafContext) => {
    })
)

bot.use(composer.middleware())
