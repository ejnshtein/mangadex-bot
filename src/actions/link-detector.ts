import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'
import { mangaView } from '@view/manga'
import { defaultConfig } from '@src/config'

const composer = new Composer<TelegrafContext>()

composer.url(
  /mangadex\.org\/title\/([0-9]+)/i,
  Composer.privateChat(async (ctx) => {
    const mangaId = parseInt(ctx.match[1])

    const { text, extra } = await mangaView({
      mangaId,
      favorite: false,
      list: '',
      history: defaultConfig.history,
      user: ctx.state.user,
      i18n: ctx.i18n
    })

    await ctx.reply(text, extra)
  })
)

bot.use(composer.middleware())
