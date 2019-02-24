const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { favoriteListView } = require('../generators')

composer.command('favorite',
  onlyPrivate,
  async ctx => {
    try {
      var { text, extra } = await favoriteListView(ctx.from.id)
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
