const Composer = require('telegraf/composer')
const composer = new Composer()
const { getChapter, getManga } = require('mangadex-api').default
const { templates, setCurrentlyReading } = require('../lib')
const cacheChapter = require('../lib/cache-chapter')

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
  if (cacheChapter.getCacheBlockingValue()) {
    return ctx.answerCbQuery(
      `Sorry, caching isn't available right now.\nThis can be because of bot update or malfunction.`,
      true,
      { cache_time: 10 }
    )
  }
  let chapter = await getChapter(chapterId)
  const { manga } = await getManga(chapter.manga_id, false)
  const chapterResult = await cacheChapter(chapter, manga, ctx, offset, history, ctx.callbackQuery.message.message_id)
  if (!chapterResult.ok) {
    return ctx.answerCbQuery(chapterResult.message, true, { cache_time: 10 })
  }
  chapter = chapterResult.chapter
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
})

module.exports = app => {
  app.use(composer.middleware())
}
