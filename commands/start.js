const Composer = require('telegraf/composer')
const composer = new Composer()
const { buffer } = require('../lib')
const { mangaView, mangaSearchView, chapterView } = require('../generators')
const { onlyPrivate } = require('../middlewares')

composer.start(onlyPrivate, async ctx => {
  if (ctx.startPayload) {
    const text = buffer.decode(ctx.startPayload)
    switch (true) {
      case /manga:[0-9]+/i.test(text):
        const mangaId = text.match(/manga:([0-9]+)/i)[1]
        const favorited = ctx.state && ctx.state.user && ctx.state.user.favorite_titles && ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(mangaId))
        const { text: mangaText, extra: mangaExtra } = await mangaView(mangaId, undefined, undefined, undefined, favorited)
        try {
          await ctx.reply(mangaText, mangaExtra)
          return
        } catch (e) {}
        break
      case /chapter:[0-9]+/i.test(text):
        const chapterId = text.match(/chapter:([0-9]+)/i)[1]
        const { text: chapterText, extra: chapterExtra } = await chapterView(chapterId)
        try {
          await ctx.reply(chapterText, chapterExtra)
          return
        } catch (e) {}
        break
      case /search:[\S\s]+/i.test(text):
        const query = text.match(/search:([\S\s])+/i)[1]
        const { text: searchText, extra: searchExtra } = await mangaSearchView(query)
        try {
          await ctx.reply(searchText, searchExtra)
          return
        } catch (e) {}
        break
    }
  }
  ctx.reply(
    `Hello!\nI'm <a href="https://mangadex.org">Mangadex</a> bot.
I can send to you chapters from your favorite manga right here, in Telegram*!
Here's basic commands: /search, /index, /notes .

*Telegra.ph + Instant View`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Let's find some manga!`,
              switch_inline_query_current_chat: ''
            }
          ]
        ]
      }
    })
})

module.exports = app => {
  app.use(composer.middleware())
}
