import { Composer } from 'telegraf'
import { bot } from '@src/bot'
import { TelegrafContext } from '@type/telegraf'
import { parseInlineArguments } from '@src/lib/inline-args'

const composer = new Composer()

composer.action(
  /^manga:(\S+)$/i,
  Composer.privateChat(async (ctx: TelegrafContext) => {
    const args = parseInlineArguments(ctx.match[1], {
      history: 'page=1:offset=0'
    })
  })
)

bot.use(composer.middleware())
