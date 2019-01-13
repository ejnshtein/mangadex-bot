const Composer = require('telegraf/composer')
const composer = new Composer()

composer.start(ctx => {
  ctx.reply('Hello there')
})

module.exports = app => {
  app.use(composer.middleware())  
}
