const Composer = require('telegraf/composer')
const composer = new Composer()
// const { onlyPrivate } = require('../middlewares')
const { readingListView } = require('../generators')

composer.action(/^list=read-([0-9]+)$/i, async ctx => {
  try {
    var { text, extra } = await readingListView(ctx.from.id, Number(ctx.match[1]))
  } catch (e) {
    console.log(e)
    return ctx.answerCbQuery('Something went wrong...')
  }
  ctx.answerCbQuery('')
  return ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
