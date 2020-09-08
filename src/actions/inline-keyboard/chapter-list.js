import { Composer } from '@telegraf/core'
import qs from 'querystring'
import chapterListView from '../../views/inline-keyboard/chapter-list.js'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'

const composer = new Composer()

composer.action(
  /^chapterlist:(\S+)$/i,
  Composer.privateChat(
    async ctx => {
      const { lang, id, offset } = qs.parse(ctx.match[1])
      try {
        const { text, extra } = await chapterListView({
          mangaId: Number.parseInt(id),
          lang,
          offset: Number.parseInt(offset) || 0,
          fromId: ctx.from.id,
          isAdmin: ctx.state.user.is_admin
        })

        await ctx.editMessageText(text, extra)
        await ctx.answerCbQuery('')
      } catch (e) {
        return ctx.answerCbQuery(templates.error(e), true)
      }
    })
)

bot.use(composer.middleware())
