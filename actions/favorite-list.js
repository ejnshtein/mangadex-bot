import Telegraf from 'telegraf-esm'
import { favoriteListView } from '../generators/index.js'
import { templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.action(/^list=fav-([0-9]+)$/i, async ctx => {
  try {
    var { text, extra } = await favoriteListView(ctx.from.id, Number(ctx.match[1]))
  } catch (e) {
    return ctx.answerCbQuery(templates.error(e), true)
  }
  ctx.answerCbQuery('')
  return ctx.editMessageText(text, extra)
})

bot.use(composer.middleware())
