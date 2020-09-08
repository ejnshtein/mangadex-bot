import { Composer } from '@telegraf/core'
import qs from 'querystring'
import mangaSearchView from '../../views/inline-keyboard/manga-search.js'
import { loadSearchParams, templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
const composer = new Composer()

composer.action(
  /search:(\S+)/i,
  Composer.privateChat(
    async ctx => {
      const { offset, page } = qs.parse(ctx.match[1])
      const [segment, query] = loadSearchParams(ctx.callbackQuery.message)
      try {
        const { text, extra } = await mangaSearchView({
          query,
          page: Number.parseInt(page),
          offset: Number.parseInt(offset)
        })
        await ctx.editMessageText(text, extra)
        await ctx.answerCbQuery('')
      } catch (e) {
        return ctx.answerCbQuery(templates.error(e), true)
      }
    })
)

bot.use(composer.middleware())
