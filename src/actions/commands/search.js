import { Composer } from '@telegraf/core'
import mangaSearchView from '../../views/inline-keyboard/manga-search.js'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
const composer = new Composer()

composer.hears(
  /\/search ([\S\s]+)/i,
  Composer.privateChat(
    async ctx => {
      const query = ctx.match[1]
      try {
        const { text, extra } = await mangaSearchView({ query })
        await ctx.reply(text, extra)
      } catch (e) {
        return ctx.reply(templates.error(e))
      }
    })
)
composer.command(
  ['search', 'index'],
  Composer.privateChat(
    async ctx => {
      try {
        const { text, extra } = await mangaSearchView({})
        await ctx.reply(text, extra)
      } catch (e) {
        return ctx.reply(templates.error(e))
      }
    })
)

bot.use(composer.middleware())
