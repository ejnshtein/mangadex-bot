import Mangadex from 'mangadex-api'
import qs from 'querystring'
import {
  templates,
  groupBy,
  loadLangCode,
  buttons,
  getList
} from '../../lib/index.js'
import collection from '../../core/database/index.js'
import cleanObject from '../../lib/clean-object.js'
const client = new Mangadex({ shareMangaCache: true })

const mangaKeys = [
  'id',
  'cover_url',
  'last_chapter',
  'lang_name',
  'lang_flag',
  'status',
  'genres',
  'title',
  'artist',
  'author',
  'description',
  'links'
]

export default async function mangaView({ mangaId, fromId }) {
  const { manga, chapter } = await client.getManga(mangaId, true)
  const withChapters = Boolean(chapter)

  const mangaExistsInDb = await collection('mangas').findOne({ id: mangaId })
  if (!mangaExistsInDb) {
    await collection('mangas').create(
      cleanObject(
        {
          ...manga,
          id: mangaId,
          genres: manga.genres.map(({ id }) => id)
        },
        mangaKeys
      )
    )
  }

  const result = await collection('mangas').aggregate([
    { $match: { id: Number.parseInt(mangaId) } },
    {
      $addFields: {
        is_favorited: {
          $in: [fromId, '$favorited']
        },
        is_reading: {
          $in: [fromId, '$reading']
        }
      }
    },
    {
      $project: {
        is_favorited: 1
      }
    }
  ])

  const mangaInDb = result.pop()

  const cachedChapters = await collection('chapters').find(
    { id: { $in: chapter.map(({ id }) => id) } },
    'id'
  )
  const keyboard = [[]]
  const chapters = groupBy(chapter, 'lang_code')
  for (const [langCode, codeChapters] of Object.entries(chapters)) {
    const cachedChaptersLength = codeChapters
      .reduce((acc, v) => {
        if (!acc.some((x) => v.chapter === x.chapter)) acc.push(v)
        return acc
      }, [])
      .filter((el) => cachedChapters.some((ch) => ch.toObject().id === el.id))
      .length

    let buttonText = ''
    if (cachedChaptersLength !== codeChapters.length) {
      buttonText += `↻ (${cachedChaptersLength}/${codeChapters.length})`
    }
    buttonText += ` Read in ${loadLangCode(langCode)}`
    const obj = {
      text: buttonText,
      callback_data: `chapterlist:${qs.stringify({
        lang: langCode,
        id: mangaId
      })}`
    }
    if (keyboard[keyboard.length - 1].length < 2) {
      keyboard[keyboard.length - 1].push(obj)
    } else {
      keyboard.push([obj])
    }
  }
  if (manga.links && manga.links.mal) {
    keyboard.unshift([
      {
        text: 'Track reading on MAL',
        url: `https://myanimelist.net/manga/${manga.links.mal}`
      }
    ])
  }
  keyboard.unshift([
    {
      text: buttons.back,
      callback_data: 'back'
    },
    {
      text: buttons.page.refresh(),
      callback_data: `manga:${qs.stringify({ id: mangaId })}`
    }
  ])
  keyboard.unshift([
    {
      text: mangaInDb.is_favorited
        ? buttons.favorite(false)
        : buttons.favorite(),
      callback_data: `favorite:${mangaId}`
    },
    {
      text: buttons.share,
      switch_inline_query: `manga:${mangaId}`
    },
    {
      text: 'Public link',
      callback_data: `sharemanga:${mangaId}`
    }
  ])
  return {
    text: templates.manga.view(mangaId, manga, undefined, withChapters),
    extra: {
      reply_markup: {
        inline_keyboard: keyboard
      },
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }
  }
}
