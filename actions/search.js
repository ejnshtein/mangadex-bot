const Composer = require('telegraf/composer')
const composer = new Composer()
const { mangaSearchView } = require('../generators')
const { loadSearchParams } = require('../lib')
composer.action(/^p=(\S+):o=(\S+)$/i, async ctx => {
  ctx.answerCbQuery('')
  const page = Number.parseInt(ctx.match[1])
  const offset = Number.parseInt(ctx.match[2])
  const {
    // params: searchParams,
    // segment: searchSegment,
    value: searchValue
  } = loadSearchParams(ctx.callbackQuery.message, page, offset)
  const { text, extra } = await mangaSearchView(searchValue, page, offset)
  ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
