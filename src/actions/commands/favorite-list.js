import { Composer } from '@telegraf/core'
import favoriteListView from '../../views/inline-keyboard/favorite-list.js'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
const composer = new Composer()

composer.command(
  'favorite',
  Composer.privateChat(
    async ctx => {
      try {
        const { text, extra } = await favoriteListView(ctx.from.id)
        await ctx.reply(text, extra)
      } catch (e) {
        return ctx.reply(templates.error(e))
      }
    }
  )
)

bot.use(composer.middleware())
