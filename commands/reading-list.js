const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { readingListView } = require('../generators')

composer.command('reading',
  onlyPrivate,
  async ctx => {
    try {
      var { text, extra } = await readingListView(ctx.from.id)
    } catch (e) {
      console.log(e)
      return ctx.reply('Something went wrong...')
    }
    return ctx.reply(text, extra)
  }
)

module.exports = app => {
  app.use(composer.middleware())
}
