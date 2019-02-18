const { getChapter, getManga } = require('mangadex-api').default
const { templates } = require('../lib')
const collection = require('../core/database')

module.exports = async (chapterId, offset = 0, history = 'p=1:o=0') => {
  let chapter = await getChapter(chapterId)
  const manga = await getManga(chapter.manga_id, false)
  // console.log(chapter)
  try {
    var chapterExists = await collection('chapters').findOne({ id: chapter.id }).exec()
  } catch (e) {
    return {
      chapter,
      manga,
      text: `Oops, something went wrong...`,
      extra: {
        parse_mode: 'HTML'
      }
    }
  }
  if (chapterExists) {
    chapter.telegraph = chapterExists.telegraph
    const keyboard = [
      [
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
    const messageText = templates.manga.chapter(chapter, manga)
    return {
      chapter,
      manga,
      text: messageText,
      extra: {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    }
  } else {
    return {
      chapter,
      manga,
      text: `This chapter isn't cached yet. Do you want to cache it?`,
      extra: {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Sure.',
                callback_data: `chapter=${chapter.id}:read=false:copy=false:offset=${offset}:${history}`
              }
            ]
          ]
        }
      }
    }
  }
}
