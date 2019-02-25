const Composer = require('telegraf/composer')
const composer = new Composer()
// const { onlyPrivate } = require('../middlewares')
const { favoriteListView } = require('../generators')

composer.action(/^list=fav-([0-9]+)$/i, async ctx => {
  try {
    var { text, extra } = await favoriteListView(ctx.from.id, Number(ctx.match[1]))
  } catch (e) {
    console.log(e)
    return ctx.reply('Something went wrong...')
  }
  ctx.answerCbQuery('')
  return ctx.editMessageText(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
