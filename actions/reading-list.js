import Telegraf from 'telegraf'
import { readingListView } from '../generators/index.js'
import { templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()
// const { onlyPrivate } = require('../middlewares')

composer.action(/^list=read-([0-9]+)$/i, async ctx => {
  try {
    var { text, extra } = await readingListView(ctx.from.id, Number(ctx.match[1]))
  } catch (e) {
    return ctx.answerCbQuery(templates.error(e), true)
  }
  ctx.answerCbQuery('')
  return ctx.editMessageText(text, extra)
})

bot.use(composer.middleware())
