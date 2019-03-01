const Composer = require('telegraf/composer')
const composer = new Composer()
const { onlyPrivate } = require('../middlewares')
const { mangaView } = require('../generators')
const Mangadex = require('mangadex-api').default
const client = new Mangadex({ shareMangaCache: true })
const { templates, buffer } = require('../lib')

composer.url(/mangadex\.org\/title\/([0-9]+)/i,
  Composer.branch(onlyPrivate,
    async ctx => {
    // console.log(ctx.match, ctx.message)
      const favorited = ctx.state && ctx.state.user && ctx.state.user.favorite_titles && ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(ctx.match[1]))
      try {
        var { extra, text } = await mangaView(ctx.match[1], undefined, undefined, undefined, favorited)
      } catch (e) {
        return ctx.reply(`Something went wrong...\n\n${e.description}`)
      }
      return ctx.reply(text, extra)
    }, async ctx => {
      try {
        var { manga } = await client.getManga(ctx.match[1])
      } catch (e) {
        console.log(e)
        return
      }
      return ctx.reply(templates.manga.viewPublic(ctx.match[1], manga), {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Read manga',
                url: `https://t.me/${ctx.me}?start=${buffer.encode(`manga:${ctx.match[1]}`)}`
              }
            ]
          ]
        }
      })
    })
)

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
