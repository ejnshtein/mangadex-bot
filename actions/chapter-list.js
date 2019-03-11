const Composer = require('telegraf/composer')
const composer = new Composer()
const { chapterListView } = require('../generators')

composer.action(/^chapterlist=(\S+):id=(\S+):offset=(\S+?):(\S+)$/i, async ctx => {
  ctx.answerCbQuery('')
  const lang = ctx.match[1]
  const mangaId = ctx.match[2]
  const offset = Number.parseInt(ctx.match[3])
  const history = ctx.match[4]

  const { user } = ctx.state

  try {
    var { text, extra } = await chapterListView(mangaId, lang, user, ctx.callbackQuery.message, offset, history)
  } catch (e) {
    console.log(e)
    return ctx.answerCbQuery('Something went wrong...')
  }

  ctx.editMessageText(text, extra)
})

composer.action(/^list=(\S+?):chapterlist=(\S+):id=(\S+):offset=([0-9]+)/i, async ctx => {
  ctx.answerCbQuery('')
  const list = ctx.match[1]
  const lang = ctx.match[2]
  const mangaId = ctx.match[3]
  const offset = Number.parseInt(ctx.match[4])

  const { user } = ctx.state

  try {
    var { text, extra } = await chapterListView(mangaId, lang, user, ctx.callbackQuery.message, offset, undefined, list)
  } catch (e) {
    console.log(e)
    return ctx.answerCbQuery('Something went wrong...')
  }

  // console.log(extra.reply_markup.inline_keyboard)
  ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
