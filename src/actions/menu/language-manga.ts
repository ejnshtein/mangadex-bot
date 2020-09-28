import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'
import { parseInlineArguments } from '@lib/inline-args'
import { languageSelectedManga } from '@src/view/language-selected-manga'

const composer = new Composer<TelegrafContext>()

/**
 * After user select language it will bring him there.
 */
composer.action(
  /^lang:(\S+)$/i,
  Composer.privateChat(async (ctx) => {
    const args = parseInlineArguments(ctx.match[1], {
      history: 'page=1:offset=0',
      list: '',
      offset: '0'
    })

    try {
      const { text, extra } = await languageSelectedManga({
        mangaId: parseInt(args.mangaId),
        list: args.list,
        user: ctx.state.user,
        history: args.history,
        i18n: ctx.i18n,
        lang: args.lang,
        offset: parseInt(args.offset)
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
