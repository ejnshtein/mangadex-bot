import Telegraf from 'telegraf'
import { mangaSearchView } from '../generators/index.js'
import { loadSearchParams, templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.action(/^p=(\S+):o=(\S+)$/i, async ctx => {
  const page = Number.parseInt(ctx.match[1])
  const offset = Number.parseInt(ctx.match[2])
  const {
    value: searchValue
  } = loadSearchParams(ctx.callbackQuery.message, page, offset)
  try {
    var { text, extra } = await mangaSearchView(searchValue, page, offset)
  } catch (e) {
    return ctx.answerCbQuery(templates.error(e), true)
  }
  ctx.answerCbQuery('')
  ctx.editMessageText(text, extra)
})

bot.use(composer.middleware())
