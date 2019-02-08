const Composer = require('telegraf/composer')
const composer = new Composer()
const { getManga } = require('mangadex-api').default
const { buttons, templates, getUrlInMessage, getGroupName } = require('../lib')

composer.action(/chapterlist=(\S+):id=(\S+):offset=(\S+?):(\S+)/i, async ctx => {
  ctx.answerCbQuery('')
  const lang = ctx.match[1]
  const mangaId = ctx.match[2]
  const offset = Number.parseInt(ctx.match[3])
  const history = ctx.match[4]

  const { user } = ctx.state

  const alreadyRead = user.already_read && user.already_read.map(el => el.chapter_id)

  const { chapter, manga } = await getManga(mangaId)

  const chapters = chapter
    .filter(el => el.lang_code === lang)

  const slicedChapters = chapters.slice(offset, offset + 20)
  const cachedChapters = await ctx.db('chapters').find({ id: { $in: slicedChapters.map(el => el.id) } }, 'id').exec()
  const keyboard = [
    []
  ]

  for (let chapterId = 0; chapterId < slicedChapters.length; chapterId++) {
    const chapter = slicedChapters[chapterId]
    const button = {
      text: `${alreadyRead ? alreadyRead.includes(chapter.id) ? '👁 ' : '' : ''}${cachedChapters.some(el => el.id === chapter.id) ? '🗲  ' : ''}${chapter.chapter ? `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}` : chapter.title}${chapters.some(el => el.chapter === chapter.chapter && el.id !== chapter.id) ? getGroupName(chapter) : ''}`,
      callback_data: `chapter=${chapter.id}:read=${alreadyRead ? alreadyRead.includes(chapter.id) ? 'true' : 'false' : 'false'}:copy=false:offset=${offset}:${history}`
    }
    if (keyboard[keyboard.length - 1].length < 2) {
      keyboard[keyboard.length - 1].push(button)
    } else {
      keyboard.push([button])
    }
  }

  const navigation = []
  if (slicedChapters.length === 20 && chapters.slice(offset + 20, offset + 40).length >= 1) {
    navigation.push(
      {
        text: buttons.next,
        callback_data: `chapterlist=${lang}:id=${mangaId}:offset=${offset + 20}:${history}`
      }
    )
  }
  if (offset - 20 === 0 || offset - 20 > 0) {
    navigation.unshift(
      {
        text: buttons.back,
        callback_data: `chapterlist=${lang}:id=${mangaId}:offset=${offset - 20}:${history}`
      }
    )
  }

  // console.log(keyboard)
  ctx.editMessageText(templates.manga.view(mangaId, manga, getUrlInMessage(ctx.callbackQuery.message), Boolean(chapter)), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Manga description',
            callback_data: `manga=${mangaId}:${history}`
          }
        ],
        manga.links['mal'] ? [
          {
            text: 'Track reading on MAL',
            url: `https://myanimelist.net/manga/${manga.links['mal']}`
          }
        ] : undefined,
        navigation
      ]
        .filter(Boolean)
        .concat(keyboard)
    }
  })
})

module.exports = app => {
  app.use(composer.middleware())
}