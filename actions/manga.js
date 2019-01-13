const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { getUrlInMessage } = require('../lib')
const { mangaView } = require('../generators')

composer.action(/manga=(\S+?):(\S+)/i, onlyPrivate, async ctx => {
  ctx.answerCbQuery('')
  // TO-DO: make something like view in ./generators in nyaasi_bot+
  // console.log(ctx.match)
  const { extra, text } = await mangaView(ctx.match[1], getUrlInMessage(ctx.callbackQuery.message).url, ctx.match[2])
  // console.log(extra.reply_markup.inline_keyboard)
  ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
