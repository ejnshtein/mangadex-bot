const Composer = require('telegraf/composer')
const composer = new Composer()
const { getChapter, getManga } = require('mangadex-api').default
const { templates, setCurrentlyReading } = require('../lib')
const getFiles = require('../lib/get-files')

composer.action([
  /chapter=(\S+):prev=(\S+):next=(\S+):offset=(\S+?):(\S+)/i,
  /chapter=(\S+):read=(\S+):next=(\S+):offset=(\S+?):(\S+)/i
], async ctx => {
  const chapterId = ctx.match[1]
  const markedRead = ctx.match[2] === 'true'
  const offset = ctx.match[4]
  const history = ctx.match[5]
  let chapter = await getChapter(chapterId)
  const manga = await getManga(chapter.manga_id, false)
  chapter = await getFiles(chapter, manga, ctx)
  if (!chapter) { return }
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
      }
    ],
    manga.manga.links['mal'] ? [
      {
        text: 'Track reading on MAL',
        url: `https://myanimelist.net/manga/${manga.manga.links['mal']}`
      }
    ] : undefined
  ].filter(Boolean)
  const messageText = templates.manga.chapter(chapter, ctx.callbackQuery.message)
  ctx.editMessageText(messageText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboard
    }
  })
  setCurrentlyReading(chapter.manga_id, chapterId, ctx.state.user)
})

module.exports = app => {
  app.use(composer.middleware())
}
