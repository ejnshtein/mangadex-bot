import Telegraf from 'telegraf-esm'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.action(/^delete$/i, async ctx => {
  try {
    await ctx.deleteMessage()
  } catch (e) {
    return ctx.answerCbQuery('This message too old, you should delete it yourserf.', true)
  }
  ctx.answerCbQuery('')
})

bot.use(composer.middleware())
