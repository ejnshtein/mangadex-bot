const Composer = require('telegraf/composer')
const composer = new Composer()
const { mangaSearchView } = require('../generators')
const { loadSearchParams } = require('../lib')

composer.action(/^p=(\S+):o=(\S+)$/i, async ctx => {
  const page = Number.parseInt(ctx.match[1])
  const offset = Number.parseInt(ctx.match[2])
  const {
    value: searchValue
  } = loadSearchParams(ctx.callbackQuery.message, page, offset)
  try {
    var { text, extra } = await mangaSearchView(searchValue, page, offset)
  } catch (e) {
    return ctx.answerCbQuery(e.message)
  }
  ctx.answerCbQuery('')
  ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
