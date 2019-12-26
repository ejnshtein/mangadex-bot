import Telegraf from 'telegraf'
import { onlyPrivate } from '../middlewares/index.js'
import { mangaView } from '../generators/index.js'
import Mangadex from 'mangadex-api'
import { templates, buffer } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()
const client = new Mangadex({ shareMangaCache: true })

composer.url(/mangadex\.org\/title\/([0-9]+)/i,
  Composer.branch(onlyPrivate,
    async ctx => {
    // console.log(ctx.match, ctx.message)
      const favorited = ctx.state && ctx.state.user && ctx.state.user.favorite_titles && ctx.state.user.toObject().favorite_titles.some(el => el.manga_id === Number(ctx.match[1]))
      try {
        var { extra, text } = await mangaView(ctx.match[1], undefined, undefined, undefined, favorited)
      } catch (e) {
        return ctx.reply(templates.error(e))
      }
      return ctx.reply(text, extra)
    }, async ctx => {
      try {
        var { manga } = await client.getManga(ctx.match[1])
      } catch (e) {
        return ctx.reply(templates.error(e))
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

bot.use(composer.middleware())
