import Telegraf from 'telegraf'
import { onlyPrivate } from '../middlewares/index.js'
import { readingListView } from '../generators/index.js'
import { templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.command('reading',
  onlyPrivate,
  async ctx => {
    try {
      var { text, extra } = await readingListView(ctx.from.id)
    } catch (e) {
      console.log(e)
      return ctx.reply(templates.error(e))
    }
    return ctx.reply(text, extra)
  }
)

bot.use(composer.middleware())
