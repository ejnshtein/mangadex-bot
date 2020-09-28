import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'
import { parseInlineArguments } from '@lib/inline-args'
import { mangaView } from '@src/view/manga'

const composer = new Composer<TelegrafContext>()

composer.action(
  /^manga:(\S+)$/i,
  Composer.privateChat(async (ctx) => {
    const args = parseInlineArguments(ctx.match[1], {
      history: 'page=1:offset=0',
      list: ''
    })

    try {
      const { text, extra } = await mangaView({
        mangaId: parseInt(args.mangaId),
        list: args.list,
        favorite: false,
        user: ctx.state.user,
        history: args.history,
        i18n: ctx.i18n
      })
      await ctx.editMessageText(text, extra)
      await ctx.answerCbQuery('')
    } catch (e) {
      console.assert(process.env.DEV !== '1', e)
      return ctx.answerCbQuery(
        ctx.i18n.t('error', { message: e.message }),
        true
      )
    }
  })
)

bot.use(composer.middleware())
