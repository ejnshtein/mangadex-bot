import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'
import { parseInlineArguments } from '@lib/inline-args'
import { languageSelectedManga } from '@src/view/language-selected-manga'

const composer = new Composer<TelegrafContext>()

/**
 * After user select language it will bring him there.
 * Accepts params:
 * mangaId
 * offset // chapters offset
 * lang // selected language code
 * list // context list, like reading, following, e.t.c
 * and history //
 */
composer.action(
  /^lang:(\S+)$/i,
  Composer.privateChat(async (ctx) => {
    const {
      m: mangaId,
      o: offset,
      la: lang,
      l: list,
      h: history
    } = parseInlineArguments(ctx.match[1], {
      h: 'page=1:offset=0',
      l: '',
      o: '0',
      m: 'none',
      la: 'none'
    })

    if (mangaId === 'none') {
      return ctx.answerCbQuery('MangaId is not provided', true)
    }

    if (lang === 'none') {
      return ctx.answerCbQuery('Language is not provided', true)
    }

    try {
      const { text, extra } = await languageSelectedManga({
        mangaId: parseInt(mangaId),
        offset: parseInt(offset),
        user: ctx.state.user,
        i18n: ctx.i18n,
        list,
        history,
        lang
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
