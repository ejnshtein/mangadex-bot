import { Composer } from '@telegraf/core'
import readingListView from '../../views/inline-keyboard/reading-list.js'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
const composer = new Composer()
// const { onlyPrivate } = require('../middlewares')

composer.action(
  /readlist:([0-9]+)/i,
  Composer.privateChat(
    async ctx => {
      try {
        const { text, extra } = await readingListView({
          fromId: ctx.from.id,
          offset: Number(ctx.match[1])
        })
        await ctx.editMessageText(text, extra)
        await ctx.answerCbQuery('')
      } catch (e) {
        return ctx.answerCbQuery(templates.error(e), true)
      }
    })
)

bot.use(composer.middleware())
