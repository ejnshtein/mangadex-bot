const { Composer } = require('telegraf').default
const composer = new Composer()

// composer.on('chosen_inline_result', async ctx => {
//   console.log(ctx.update.chosen_inline_result)
// })

module.exports = app => {
  app.use(composer.middleware())
}
