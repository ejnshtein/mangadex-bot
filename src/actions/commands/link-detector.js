import { Composer } from '@telegraf/core'
import Mangadex from 'mangadex-api'
import { templates, buffer } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
import mangaView from '../../views/inline-keyboard/manga.js'
const composer = new Composer()
const client = new Mangadex({ shareMangaCache: true })

composer.url(
  /mangadex\.org\/title\/([0-9]+)/i,
  Composer.privateChat(async (ctx) => {
    const id = Number.parseInt(ctx.match[1])
    // console.log(ctx.match, ctx.message)
    // const favorited = ctx.state && ctx.state.user && ctx.state.user.favorite_titles && ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(ctx.match[1]))
    try {
      const { extra, text } = await mangaView({
        mangaId: id,
        fromId: ctx.from.id
      })
      await ctx.reply(text, extra)
    } catch (e) {
      return ctx.reply(templates.error(e))
    }
  })
)

composer.url(
  /mangadex\.org\/title\/([0-9]+)/i,
  Composer.groupChat(async (ctx) => {
    const id = ctx.match[1]
    try {
      const { manga } = await client.getManga(id)
      await ctx.reply(templates.manga.viewPublic(id, manga), {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Read manga',
                url: `https://t.me/${ctx.me}?start=${buffer.encode(
                  `manga:${id}`
                )}`
              }
            ]
          ]
        }
      })
    } catch (e) {
      return ctx.reply(templates.error(e))
    }
  })
)

bot.use(composer.middleware())
