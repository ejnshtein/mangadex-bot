import { Composer } from '@telegraf/core'
import readingListView from '../../views/inline-keyboard/reading-list.js'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'

const composer = new Composer()

composer.command('reading',
  Composer.privateChat(
    async ctx => {
      try {
        const { text, extra } = await readingListView({ fromId: ctx.from.id })
        return ctx.reply(text, extra)
      } catch (e) {
        return ctx.reply(templates.error(e))
      }
    }
  )
)

bot.use(composer.middleware())
