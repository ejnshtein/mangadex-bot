const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { mangaSearchView } = require('../generators')

composer.hears(/\/search ([\S\s]+)/i, onlyPrivate, async ctx => {
  const query = ctx.match[1]
  try {
    var { text, extra } = await mangaSearchView(query)
  } catch (e) {
    return ctx.reply(`Error: ${e.message}`)
  }
  ctx.reply(text, extra)
})
composer.command(['search', 'index'], onlyPrivate, async ctx => {
  try {
    var { text, extra } = await mangaSearchView('')
  } catch (e) {
    return ctx.reply(`Error: ${e.message}`)
  }
  ctx.reply(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
