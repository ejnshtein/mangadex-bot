import { Composer } from '@telegraf/core'
import qs from 'querystring'
import { templates } from '../../lib/index.js'
import mangaView from '../../views/inline-keyboard/manga.js'
import { bot } from '../../core/bot.js'

const composer = new Composer()

composer.action(
  /^manga:(\S+)$/i,
  Composer.privateChat(async (ctx) => {
    const { id } = qs.parse(ctx.match[1])
    try {
      const { extra, text } = await mangaView({
        mangaId: Number.parseInt(id),
        fromId: ctx.from.id
      })
      await ctx.editMessageText(text, extra)
      await ctx.answerCbQuery('')
    } catch (e) {
      return ctx.answerCbQuery(templates.error(e), true)
    }
  })
)

bot.use(composer.middleware())
