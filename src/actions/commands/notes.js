import { Composer } from '@telegraf/core'
import { bot } from '../../core/bot.js'

const composer = new Composer()

composer.command('notes',
  Composer.privateChat(
    Composer.reply(
      `· I recommend to use Official Telegram app for [Android](https://telegram.org/dl/android) or [iOS](https://telegram.org/dl/ios) instead of [X version](https://play.google.com/store/apps/details?id=org.thunderdog.challegram&hl=en), Telegram beta is ok too.
  Because in X version (for Android, i don't have iOS device, so idk) pictures have worse quality than in Official one (for Android, i don't have iOS device, so idk, and yes, X version is official too, but it's _a slick experimental Telegram client based on TDLib._ [Here](https://telegram.org/apps#telegram-database-library-tdlib))

  _This message can be changed._`, {
        parse_mode: 'markdown'
      })
  )
)

bot.use(composer.middleware())
