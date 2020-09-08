import { Composer } from '@telegraf/core'
import qs from 'querystring'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
import favoriteListView from '../../views/inline-keyboard/favorite-list.js'
const composer = new Composer()

composer.action(
  /^favoritelist:(\S+)$/i,
  Composer.privateChat(
    async ctx => {
      const { offset } = qs.parse(ctx.match[1])
      try {
        const { text, extra } = await favoriteListView(ctx.from.id, Number.parseInt(offset))
        await ctx.editMessageText(text, extra)
        await ctx.answerCbQuery('')
      } catch (e) {
        return ctx.answerCbQuery(templates.error(e), true)
      }
    })
)

bot.use(composer.middleware())
