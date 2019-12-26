import Telegraf from 'telegraf'
import { onlyPrivate } from '../middlewares/index.js'
import { mangaSearchView } from '../generators/index.js'
import { templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.hears(/\/search ([\S\s]+)/i, onlyPrivate, async ctx => {
  const query = ctx.match[1]
  try {
    var { text, extra } = await mangaSearchView(query)
  } catch (e) {
    return ctx.reply(templates.error(e))
  }
  ctx.reply(text, extra)
})
composer.command(['search', 'index'], onlyPrivate, async ctx => {
  try {
    var { text, extra } = await mangaSearchView('')
  } catch (e) {
    return ctx.reply(templates.error(e))
  }
  ctx.reply(text, extra)
})

bot.use(composer.middleware())
