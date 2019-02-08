const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { mangaView, chapterView } = require('../generators')

composer.url(/mangadex\.org\/title\/([0-9]+)/i, onlyPrivate, async ctx => {
  // console.log(ctx.match, ctx.message)
  try {
    var { extra, text } = await mangaView(ctx.match[1])
  } catch (e) {
    return ctx.reply(`Something went wrong...\n\n${e.description}`)
  }
  ctx.reply(text, extra)
})

// composer.url(/mangadex\.org\/chapter\/([0-9]+)/i, async ctx => {
// })

// composer.hears(/\/search ([\S\s]+)/i, onlyPrivate, async ctx => {
//   const query = ctx.match[1]
//   const { text, extra } = await mangaSearchView(query)
//   ctx.reply(text, extra)
// })
// composer.command(['search', 'index'], onlyPrivate, async ctx => {
//   const { text, extra } = await mangaSearchView('')
//   ctx.reply(text, extra)
// })

module.exports = app => {
  app.use(composer.middleware())
}
