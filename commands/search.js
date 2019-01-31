const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { mangaSearchView } = require('../generators')

composer.hears(/\/search ([\S\s]+)/i, onlyPrivate, async ctx => {
  const query = ctx.match[1]
  const { text, extra } = await mangaSearchView(query)
  ctx.reply(text, extra)
})
composer.command(['search', 'index'], onlyPrivate, async ctx => {
  const { text, extra } = await mangaSearchView('')
  ctx.reply(text, extra)
})

module.exports = app => {
  app.use(composer.middleware())
}
