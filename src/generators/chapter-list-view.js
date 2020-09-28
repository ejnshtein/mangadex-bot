import Mangadex from 'mangadex-api'
import {
  buttons,
  templates,
  getUrlInMessage,
  getGroupName,
  getList
} from '../lib/index.js'
import collection from '../core/database/index.js'
const client = new Mangadex({
  shareMangaCache: true
})

export default async (
  mangaId,
  lang,
  user,
  message,
  offset = 0,
  history = 'p=1:o=0',
  list
) => {
  // const { user } = ctx.state

  const alreadyRead =
    user.already_read && user.already_read.map((el) => el.chapter_id)

  const { chapter, manga } = await client.getManga(mangaId)

  const chapters = chapter.filter((el) => el.lang_code === lang)

  const slicedChapters = chapters.slice(offset, offset + 20)
  const cachedChapters = await collection('chapters')
    .find({ id: { $in: chapters.map(({ id }) => id) } }, 'id')
    .exec()
  const unCachedChapters = chapters.filter(
    (el) => !cachedChapters.some((ch) => ch.toObject().id === el.id)
  )
  const keyboard = [[]]

  for (let chapterId = 0; chapterId < slicedChapters.length; chapterId++) {
    const chapter = slicedChapters[chapterId]
    const button = {
      text: `${
        alreadyRead ? (alreadyRead.includes(chapter.id) ? '👁 ' : '') : ''
      }${cachedChapters.some((el) => el.id === chapter.id) ? '⬇  ' : ''}${
        chapter.chapter
          ? `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${
              chapter.chapter
            }`
          : chapter.title
      }${
        chapters.some(
          (el) => el.chapter === chapter.chapter && el.id !== chapter.id
        )
          ? getGroupName(chapter)
          : ''
      }`,
      callback_data: `${list ? `list=${list}:` : ''}chapter=${
        chapter.id
      }:read=${
        alreadyRead
          ? alreadyRead.includes(chapter.id)
            ? 'true'
            : 'false'
          : 'false'
      }:copy=false:offset=${offset}${list ? '' : `:${history}`}`
    }
    if (keyboard[keyboard.length - 1].length < 2) {
      keyboard[keyboard.length - 1].push(button)
    } else {
      keyboard.push([button])
    }
  }

  const navigation = []
  if (
    slicedChapters.length === 20 &&
    chapters.slice(offset + 20, offset + 40).length >= 1
  ) {
    navigation.push({
      text: buttons.next,
      callback_data: `${
        list ? `list=${list}:` : ''
      }chapterlist=${lang}:id=${mangaId}:offset=${offset + 20}${
        list ? '' : `:${history}`
      }`
    })
  }
  if (
    slicedChapters.length === 20 &&
    chapters.slice(offset + 40, offset + 60).length >= 1
  ) {
    navigation.push({
      text: buttons.page.nextDub('End'),
      callback_data: `${
        list ? `list=${list}:` : ''
      }chapterlist=${lang}:id=${mangaId}:offset=${
        Math.floor(chapters.length / 20) * 20
      }${list ? '' : `:${history}`}`
    })
  }
  navigation.unshift({
    text: buttons.page.refresh(),
    callback_data: `${
      list ? `list=${list}:` : ''
    }chapterlist=${lang}:id=${mangaId}:offset=${offset}${
      list ? '' : `:${history}`
    }`
  })

  if (offset - 20 === 0 || offset - 20 > 0) {
    navigation.unshift({
      text: buttons.back,
      callback_data: `${
        list ? `list=${list}:` : ''
      }chapterlist=${lang}:id=${mangaId}:offset=${offset - 20}${
        list ? '' : `:${history}`
      }`
    })
  }
  if (offset - 40 === 0 || offset - 40 > 0) {
    navigation.unshift({
      text: buttons.page.prevDub('First'),
      callback_data: `${
        list ? `list=${list}:` : ''
      }chapterlist=${lang}:id=${mangaId}:offset=0${list ? '' : `:${history}`}`
    })
  }
  return {
    text: templates.manga.view(
      mangaId,
      manga,
      getUrlInMessage(message),
      Boolean(chapter),
      list ? `<b>List:</b> ${getList(list.match(/([a-z]+)/i)[1])}` : ''
    ),
    extra: {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Manga description',
              callback_data: `${list ? `list=${list}:` : ''}manga=${mangaId}${
                list ? '' : `:${history}`
              }`
            },
            user.id === process.env.ADMIN_ID && unCachedChapters.length
              ? {
                  text: `Cache ${unCachedChapters.length}/${chapters.length} chapters`,
                  callback_data: `cachemanga=${mangaId}:lang=${lang}`
                }
              : undefined
          ].filter(Boolean),
          manga.links && manga.links.mal
            ? [
                {
                  text: 'Track reading on MAL',
                  url: `https://myanimelist.net/manga/${manga.links.mal}`
                }
              ]
            : undefined,
          navigation
        ]
          .filter(Boolean)
          .concat(keyboard)
      }
    }
  }
}
