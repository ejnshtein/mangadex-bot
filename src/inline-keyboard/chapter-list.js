import Mangadex from 'mangadex-api'
import qs from 'querystring'
import { buttons, templates, getUrlInMessage, getGroupName, getList } from '../../lib/index.js'
import collection from '../../core/database/index.js'
const client = new Mangadex({
  shareMangaCache: true
})

export default async function chapterListView ({
  mangaId,
  lang,
  fromId,
  isAdmin,
  offset = 0
}) {
  const { chapter, manga } = await client.getManga(mangaId)

  const chapters = chapter
    .filter(el => el.lang_code === lang)

  const slicedChapters = chapters.slice(offset, offset + 20)
  const cachedChapters = await collection('chapters').aggregate([
    {
      $match: {
        id: {
          $in: chapters.map(({ id }) => id)
        }
      }
    },
    {
      $addFields: {
        is_read: {
          $in: [fromId, '$read']
        }
      }
    },
    {
      $project: {
        read: 0
      }
    }
  ])
  const unCachedChapters = chapters.filter(el => !cachedChapters.some(ch => ch.toObject().id === el.id))
  const keyboard = [
    []
  ]
  for (const chapter of slicedChapters) {
    const isChapterRead = cachedChapters.some(({ id }) => id === chapter.id) && cachedChapters.find(({ id }) => id === chapter.id).is_read
    const isChapterCached = cachedChapters.some(el => el.id === chapter.id)
    const button = {
      text: `${isChapterRead ? '👁 ' : ''}${isChapterCached ? '⬇  ' : ''}${chapter.chapter ? `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}` : chapter.title}${chapters.some(el => el.chapter === chapter.chapter && el.id !== chapter.id) ? getGroupName(chapter) : ''}`,
      callback_data: `chapter:${qs.stringify({ id: chapter.id, copy: false })}`
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
        callback_data: `chapterlist:${qs.stringify({ id: mangaId, lang, offset: offset + 20 })}`
      }
    )
  }
  if (slicedChapters.length === 20 && chapters.slice(offset + 40, offset + 60).length >= 1) {
    navigation.push(
      {
        text: buttons.page.nextDub('End'),
        callback_data: `chapterlist:${qs.stringify({ id: mangaId, lang, offset: Math.floor(chapters.length / 20) * 20 })}`
      }
    )
  }
  navigation.unshift(
    {
      text: buttons.page.refresh(),
      callback_data: `chapterlist:${qs.stringify({ id: mangaId, lang, offset })}`
    }
  )

  if (offset - 20 === 0 || offset - 20 > 0) {
    navigation.unshift(
      {
        text: buttons.back,
        callback_data: `chapterlist:${qs.stringify({ id: mangaId, lang, offset: offset - 20 })}`
      }
    )
  }
  if (offset - 40 === 0 || offset - 40 > 0) {
    navigation.unshift(
      {
        text: buttons.page.prevDub('First'),
        callback_data: `chapterlist:${qs.stringify({ id: mangaId, lang, offset: 0 })}`
      }
    )
  }
  return {
    text: templates.manga.view(
      mangaId,
      manga,
      undefined,
      Boolean(chapter)
    ),
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Manga description',
              callback_data: `manga:id=${mangaId}`
            },
            isAdmin && unCachedChapters.length ? {
              text: `Cache ${unCachedChapters.length}/${chapters.length} chapters`,
              callback_data: `cachemanga:${qs.stringify({ id: mangaId, lang })}`
            } : undefined
          ].filter(Boolean),
          manga.links && manga.links.mal ? [
            {
              text: 'Track reading on MAL',
              url: `https://myanimelist.net/manga/${manga.links.mal}`
            }
          ] : undefined,
          navigation
        ]
          .filter(Boolean)
          .concat(keyboard)
      }
    }
  }
}
