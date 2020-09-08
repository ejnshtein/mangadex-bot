import { Composer } from '@telegraf/core'
import { buffer } from '../../lib/index.js'
import mangaView from '../../views/inline-keyboard/manga.js'
import chapterView from '../../views/inline-keyboard/chapter.js'
import { bot } from '../../core/bot.js'
const composer = new Composer()

composer.start(
  Composer.privateChat(async (ctx) => {
    if (ctx.startPayload) {
      const text = buffer.decode(ctx.startPayload)
      switch (true) {
        case /manga:[0-9]+/i.test(text): {
          const [_, id] = text.match(/manga:([0-9]+)/i)
          try {
            const { text: messageText, extra } = await mangaView({
              fromId: ctx.from.id,
              mangaId: Number.parseInt(id),
            })
            await ctx.reply(messageText, extra)
            return
          } catch (e) {}
          break
        }
        case /chapter:[0-9]+/i.test(text): {
          const [_, id] = text.match(/chapter:([0-9]+)/i)
          try {
            const { text: messageText, extra } = await chapterView({
              chapterId: Number.parseInt(id),
              fromId: ctx.from.id,
            })
            await ctx.reply(messageText, extra)
            return
          } catch (e) {}
          break
        }
        // case /search:[\S\s]+/i.test(text): {
        //   const query = text.match(/search:([\S\s])+/i)[1]
        //   const { text: searchText, extra: searchExtra } = await mangaSearchView(query)
        //   try {
        //     await ctx.reply(searchText, searchExtra)
        //     return
        //   } catch (e) {}
        //   break
        // }
      }
    }
    return ctx.reply(
      `Hello!\nI'm <a href="https://mangadex.org">Mangadex</a> bot.
    I can send to you chapters from your favorite manga right here, in Telegram*!
    Here's basic commands: /search, /index, /notes .

    *Telegra.ph + Instant View`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Let's find some manga!'`,
                switch_inline_query_current_chat: '',
              },
            ],
          ],
        },
      }
    )
  })
)

bot.use(composer.middleware())
