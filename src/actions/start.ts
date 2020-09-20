import { Composer, TelegrafContext } from 'telegraf'
import { bot } from '@src/bot'

const composer = new Composer<TelegrafContext>()

composer.start(
  Composer.privateChat((ctx) =>
    ctx.reply(ctx.i18n.t('start.greetings'), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ctx.i18n.t('start.greetings_inline'),
              switch_inline_query_current_chat: ''
            }
          ]
        ]
      }
    })
  )
)

bot.use(composer.middleware())
