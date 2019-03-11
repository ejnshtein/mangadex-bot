const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { getUrlInMessage } = require('../lib')
const { mangaView } = require('../generators')

composer.action(/^manga=(\S+?):(\S+)$/i, onlyPrivate, async ctx => {
  if (!/p=[0-9]+:o=[0-9]+/i.test(ctx.match[2])) ctx.match[2] = `p=1:o=0`
  const favorited = ctx.state && ctx.state.user && ctx.state.user.favorite_titles && ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(ctx.match[1]))
  // console.log(favorited)
  try {
    var { extra, text } = await mangaView(ctx.match[1], getUrlInMessage(ctx.callbackQuery.message), ctx.match[2], undefined, favorited)
  } catch (e) {
    return ctx.answerCbQuery(e.message)
  }
  ctx.answerCbQuery('')
  ctx.editMessageText(text, extra)
})
composer.action(/^list=(\S+?):manga=([0-9]+)/i, onlyPrivate, async ctx => {
  const favorited = ctx.state && ctx.state.user && ctx.state.user.favorite_titles && ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(ctx.match[2]))
  // console.log(favorited, ctx.state.user.favorite_titles, ctx.state.user.favorite_titles[0].manga_id, Number(ctx.match[2]))
  try {
    var { extra, text } = await mangaView(ctx.match[2], getUrlInMessage(ctx.callbackQuery.message), ctx.match[3], ctx.match[1], favorited)
  } catch (e) {
    return ctx.answerCbQuery(e.message)
  }
  ctx.answerCbQuery('')
  ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
