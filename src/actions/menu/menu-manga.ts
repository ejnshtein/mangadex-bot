import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'
import { parseInlineArguments } from '@lib/inline-args'
import { mangaView } from '@src/view/manga'

const composer = new Composer<TelegrafContext>()

composer.action(
  /^manga:(\S+)$/i,
  Composer.privateChat(async (ctx) => {
    const { m: mangaId, l: list, h: history } = parseInlineArguments(
      ctx.match[1],
      {
        h: 'page=1:offset=0',
        l: '',
        m: 'none'
      }
    )

    if (mangaId === 'none') {
      return ctx.answerCbQuery('MangaId is not provided', true)
    }

    try {
      const { text, extra } = await mangaView({
        mangaId: parseInt(mangaId),
        list,
        favorite: false,
        user: ctx.state.user,
        history: history,
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
