import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'

const composer = new Composer<TelegrafContext>()

composer.action(/^delete$/i, async (ctx) => {
  try {
    await ctx.deleteMessage()
  } catch (e) {
    return ctx.answerCbQuery(ctx.i18n.t('delete.too_old_message'), true)
  }
  return ctx.answerCbQuery('')
})

bot.use(composer.middleware())
