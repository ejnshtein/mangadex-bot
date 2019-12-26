import { onlyPrivate } from '../middlewares/index.js'
import { favoriteListView } from '../generators/index.js'
import { templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
import Telegraf from 'telegraf'
const { Composer } = Telegraf
const composer = new Composer()

composer.command('favorite',
  onlyPrivate,
  async ctx => {
    try {
      var { text, extra } = await favoriteListView(ctx.from.id)
    } catch (e) {
      return ctx.reply(templates.error(e))
    }
    return ctx.reply(text, extra)
  }
)

bot.use(composer.middleware())
