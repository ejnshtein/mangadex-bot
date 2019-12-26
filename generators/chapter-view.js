import Mangadex from 'mangadex-api'
import { templates, getList } from '../lib/index.js'
import collection from '../core/database/index.js'

const client = new Mangadex({
  shareChapterCache: true,
  shareMangaCache: true
})

export default async (chapterId, offset = 0, history = 'p=1:o=0', list) => {
  const chapter = await client.getChapter(chapterId)
  const manga = await client.getManga(chapter.manga_id, false)
  // console.log(chapter)
  try {
    var chapterExists = await collection('chapters').findOne({ id: chapter.id }).exec()
  } catch (e) {
    return {
      chapter,
      manga,
      text: 'Oops, something went wrong...',
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
          text: 'Instant View',
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
          callback_data: `${list ? `list=${list}:` : ''}chapterlist=${chapter.lang_code}:id=${chapter.manga_id}:offset=${offset}${list ? '' : `:${history}`}`
        },
        {
          text: 'Manga description',
          callback_data: `${list ? `list=${list}:` : ''}manga=${chapter.manga_id}${list ? '' : `:${history}`}`
        }
      ],
      manga.manga.links && manga.manga.links.mal ? [
        {
          text: 'Track reading on MAL',
          url: `https://myanimelist.net/manga/${manga.manga.links.mal}`
        }
      ] : undefined
    ].filter(Boolean)
    const messageText = templates.manga.chapter(
      chapter,
      manga,
      undefined,
      list
        ? `<b>List:</b> ${getList(list.match(/([a-z]+)/i)[1])}`
        : ''
    )
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
      text: `${templates.chapter.formatChapter(chapter)} isn't cached yet. Do you want to cache it?`,
      extra: {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Sure.',
                callback_data: `${list ? `list=${list}:` : ''}chapter=${chapter.id}:read=false:copy=false:offset=${offset}${list ? '' : `:${history}`}`
              }
            ]
          ]
        }
      }
    }
  }
}
