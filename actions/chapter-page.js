const Composer = require('telegraf/composer')
const composer = new Composer()
const { getChapter, getManga } = require('mangadex-api')
const { templates } = require('../lib')

const getFiles = require('../lib/get-files')

composer.action(/chapter=(\S+):prev=(\S+):next=(\S+):offset=(\S+?):(\S+)/i, async ctx => {
  const chapterId = ctx.match[1]
  // const prevChapterId = ctx.match[2]
  // const nextChapterId = ctx.match[3]
  const offset = ctx.match[4]
  const history = ctx.match[5]
  // console.log(chapterId)
  let chapter = await getChapter(chapterId)
  const manga = await getManga(chapter.manga_id, false)
  chapter = await getFiles(chapter, manga, ctx)
  if (!chapter) { return }
  // const navigation = [
  //   {
  //     text: buttons.page.locate(`${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}`),
  //     callback_data: ctx.match[0]
  //   }
  // ]

  // if (prevChapterId !== 'null') {
  //   navigation.unshift(
  //     {
  //       text: buttons.page.prev(`Previous chapter`),
  //       callback_data: `chapterread=${prevChapterId}:id=${chapter.id}:offset=${offset}:${history}`
  //     }
  //   )
  // }
  // in progress
  // if (nextChapterId !== 'null') {
  //   navigation.push(
  //     {
  //       text: buttons.page.prev(`Next chapter`),
  //       callback_data: `chapterread=${nextChapterId}:id=${chapter.id}:offset=${offset}:${history}`
  //     }
  //   )
  // }
  const keyboard = [
    // navigation,
    [
      {
        text: 'Desktop Instant View',
        url: chapter.telegraph
      }
    ],
    [
      {
        text: 'Chapter list',
        callback_data: `chapterlist=${chapter.lang_code}:id=${chapter.manga_id}:offset=${offset}:${history}`
      }
    ],
    [
      {
        text: 'Manga description',
        callback_data: `manga=${chapter.manga_id}:${history}`
      }
    ],
    manga.manga.links['mal'] ? [
      {
        text: 'Track reading on MAL',
        url: `https://myanimelist.com/anime/${manga.manga.links['mal']}`
      }
    ] : []
  ].filter(el => el.length > 0)
  // console.log(ctx.callbackQuery.message)
  const messageText = templates.manga.chapter(chapter, ctx.callbackQuery.message)
  ctx.editMessageText(messageText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: keyboard
    }
  })
})

module.exports = app => {
  app.use(composer.middleware())
}
