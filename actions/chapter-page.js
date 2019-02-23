const { Telegram, Composer } = require('telegraf')
const composer = new Composer()
const { getChapter, getManga } = require('mangadex-api').default
const { templates, setCurrentlyReading } = require('../lib')
const cacheChapter = require('../lib/cache-chapter')
const client = new Telegram(process.env.BOT_TOKEN)

composer.action([
  /^chapter=(\S+):prev=(\S+):next=(\S+):offset=(\S+?):(\S+)$/i,
  /^chapter=(\S+):read=(\S+):next=(\S+):offset=(\S+?):(\S+)$/i,
  /^chapter=(\S+):read=(\S+):copy=(\S+):offset=(\S+?):(\S+)$/i
], async ctx => {
  // console.log(ctx.match)
  const chapterId = ctx.match[1]
  const markedRead = ctx.match[2] === 'true'
  const copy = ctx.match[3] === 'true'
  const offset = ctx.match[4]
  const history = ctx.match[5]
  let chapter = await getChapter(chapterId)
  const { manga } = await getManga(chapter.manga_id, false)
  try {
    var chapterCaching = await cacheChapter(chapter, manga, ctx)
  } catch (e) {
    return ctx.answerCbQuery(e.message, true, { cache_time: 10 })
  }
  if (chapterCaching.telegraph) {
    chapter.telegraph = chapterCaching.telegraph
    const keyboard = [
      [
        {
          text: markedRead ? 'Mark unread' : 'Mark read',
          callback_data: `read:${chapterId}`
        },
        {
          text: 'Desktop Instant View',
          url: chapter.telegraph
        },
        {
          text: 'Share chapter',
          switch_inline_query: `chapter:${chapterId}`
        }
      ],
      [
        {
          text: 'Chapter list',
          callback_data: `chapterlist=${chapter.lang_code}:id=${chapter.manga_id}:offset=${offset}:${history}`
        },
        {
          text: 'Manga description',
          callback_data: `manga=${chapter.manga_id}:${history}`
        },
        {
          text: 'Send copy',
          callback_data: `chapter=${chapterId}:read=${ctx.match[2]}:copy=true:offset=${offset}:${history}`
        }
      ],
      manga.links['mal'] ? [
        {
          text: 'Track reading on MAL',
          url: `https://myanimelist.net/manga/${manga.links['mal']}`
        }
      ] : undefined
    ].filter(Boolean)
    const messageText = templates.manga.chapter(chapter, manga, ctx.callbackQuery.message)
    if (copy) {
      ctx.reply(messageText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      })
    } else {
      ctx.editMessageText(messageText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      })
    }
    setCurrentlyReading(chapter.manga_id, chapterId, ctx.state.user)
  } else {
    const queue = emitChapterStatusPool()
    const msg = await ctx.reply(chapterCaching.cached > 0 ? `${chapterCaching.cached} pictures already cached...` : `Chapter isn't cached yet, starting caching chapter ${chapter.chapter}...`, {
      reply_to_message_id: ctx.callbackQuery.message.message_id
    })
    chapterCaching.on('pictureCached', ({ total, cached }) => {
      queue(msg.chat.id, msg.message_id, `Chapter ${chapter.chapter}\nCached ${cached} of ${total} pictures.`)
    })
    chapterCaching.on('done', async () => {
      await ctx.collection('chapters').create({
        id: chapter.id,
        telegraph: chapterCaching.telegraph,
        timestamp: chapter.timestamp,
        manga_id: chapter.manga_id,
        manga_title: manga.title
      })
      // client.deleteMessage(msg.chat.id, msg.message_id)
      try {
        await client.editMessageText(
          msg.chat.id,
          msg.message_id,
          undefined,
          `${manga.title}\n${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter} in ${chapter.lang_name} ready for reading!`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: 'Ok!',
                    callback_data: 'delete'
                  },
                  {
                    text: 'Load chapter',
                    callback_data: `chapter=${chapter.id}:read=false:copy=false:offset=${offset}:${history}`
                  }
                ]
              ]
            }
          }
        )
      } catch (e) {
        console.log(e)
      }
    })
    chapterCaching.on('error', error => {
      ctx.telegram.editMessageText(
        ctx.from.id,
        msg.message_id,
        undefined,
        `Error: ${error.message}`
      )
    })
  }
})

module.exports = app => {
  app.use(composer.middleware())
}

const emitChapterStatusPool = () => {
  let blocked = false
  setInterval(() => {
    blocked = false
  }, 2500)

  return async (chatId, messageId, message) => {
    if (blocked) { return }
    blocked = true
    try {
      client.editMessageText(
        chatId,
        messageId,
        undefined,
        message
      )
    } catch (e) {}
  }
}