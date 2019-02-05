const Composer = require('telegraf/composer')
const composer = new Composer()

composer.action(/^delete$/i, async ctx => {
  ctx.answerCbQuery('')
  try {
    await ctx.deleteMessage()
  } catch (e) {
    await ctx.answerCbQuery('This message too old, you should delete it yourserf.', true)
  }
})

module.exports = app => {
  app.use(composer.middleware())
}
