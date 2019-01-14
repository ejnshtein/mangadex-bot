const Composer = require('telegraf/composer')
const composer = new Composer()

composer.action(/^delete$/i, async ctx => {
  await ctx.deleteMessage()
})

module.exports = app => {
  app.use(composer.middleware())
}
