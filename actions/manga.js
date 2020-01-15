import Telegraf from 'telegraf-esm'
import { onlyPrivate } from '../middlewares/index.js'
import { getUrlInMessage, templates } from '../lib/index.js'
import { mangaView } from '../generators/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.action(/^manga=(\S+?):(\S+)$/i, onlyPrivate, async ctx => {
  if (!/p=[0-9]+:o=[0-9]+/i.test(ctx.match[2])) {
    ctx.match[2] = 'p=1:o=0'
  }
  const favorited = (
    ctx.state &&
    ctx.state.user &&
    ctx.state.user.favorite_titles &&
    ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(ctx.match[1]))
  )

  try {
    var { extra, text } = await mangaView(ctx.match[1], getUrlInMessage(ctx.callbackQuery.message), ctx.match[2], undefined, favorited)
  } catch (e) {
    return ctx.answerCbQuery(templates.error(e), true)
  }
  ctx.answerCbQuery('')
  ctx.editMessageText(text, extra)
})

composer.action(/^list=(\S+?):manga=([0-9]+)/i, onlyPrivate, async ctx => {
  const favorited = (
    ctx.state &&
    ctx.state.user &&
    ctx.state.user.favorite_titles &&
    ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(ctx.match[2]))
  )

  try {
    var { extra, text } = await mangaView(
      ctx.match[2],
      getUrlInMessage(ctx.callbackQuery.message),
      ctx.match[3],
      ctx.match[1],
      favorited
    )
  } catch (e) {
    return ctx.answerCbQuery(templates.error(e), true)
  }
  ctx.answerCbQuery('')
  ctx.editMessageText(text, extra)
})

bot.use(composer.middleware())
