import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'
import { parseInlineArguments } from '@src/lib/inline-args'
import { mangaView } from '@src/view/manga'

const composer = new Composer<TelegrafContext>()

composer.action(
  /^manga:(\S+)$/i,
  Composer.privateChat(async (ctx) => {
    const args = parseInlineArguments(ctx.match[1], {
      history: 'page=1:offset=0',
      list: ''
    })

    const { text, extra } = await mangaView({
      mangaId: parseInt(args.mangaid),
      list: args.list,
      favorite: false,
      user: ctx.state.user,
      history: args.history,
      i18n: ctx.i18n
    })

    await ctx.reply(text, extra)
  })
)

bot.use(composer.middleware())
