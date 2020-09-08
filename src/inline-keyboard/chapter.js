import Mangadex from 'mangadex-api'
import { templates, getList } from '../../lib/index.js'
import collection from '../../core/database/index.js'
import qs from 'querystring'

const client = new Mangadex({
  shareChapterCache: true,
  shareMangaCache: true
})

export default async function chapterView ({
  chapterId,
  fromId
}) {
  const chapter = await client.getChapter(chapterId)
  const manga = await client.getManga(chapter.manga_id, false)
  const chapterCached = await collection('chapters').findOne({ id: chapter.id })
  if (chapterCached) {
    const { telegraph } = chapterCached
    const keyboard = [
      [
        {
          text: 'Instant View',
          url: telegraph
        },
        {
          text: 'Share chapter',
          switch_inline_query: `chapter:${chapterId}`
        }
      ],
      [
        {
          text: 'Chapter list',
          callback_data: `chapterlist:${qs.stringify({
            lang: chapter.lang_code,
            id: chapter.manga_id
          })}`
        },
        {
          text: 'Manga description',
          callback_data: `manga:id=${chapter.manga_id}`
        }
      ]
    ]
    if (manga.manga.links && manga.manga.links.mal) {
      keyboard.push([
        {
          text: 'Track reading on MAL',
          url: `https://myanimelist.net/manga/${manga.manga.links.mal}`
        }
      ])
    }
    chapter.telegraph = telegraph
    const messageText = templates.manga.chapter(
      chapter,
      manga
    )
    return {
      text: messageText,
      cachedChapter: true,
      extra: {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    }
  } else {
    return {
      text: `${templates.chapter.formatChapter(chapter)} isn't cached yet. Working on it...`,
      cachedChapter: false
    }
  }
}
