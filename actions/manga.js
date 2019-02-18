const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { getUrlInMessage } = require('../lib')
const { mangaView } = require('../generators')

composer.action(/^manga=(\S+?):(\S+)$/i, onlyPrivate, async ctx => {
  ctx.answerCbQuery('')
  const { extra, text } = await mangaView(ctx.match[1], getUrlInMessage(ctx.callbackQuery.message), ctx.match[2])
  ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
