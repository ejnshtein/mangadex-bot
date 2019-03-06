const Mangadex = require('mangadex-api').default
const client = new Mangadex({ shareMangaCache: true })
const { templates, groupBy, loadLangCode, buttons, getList } = require('../lib')
const collection = require('../core/database')

module.exports = async (mangaId, queryUrl = 'https://mangadex.org/search?title=', history = 'p=1:o=0', list, favorite = false) => {
  const { manga, chapter } = await client.getManga(mangaId)
  const withChapters = Boolean(chapter)

  // checkManga(
  //   typeof mangaId === 'string' ? Number.parseInt(mangaId) : mangaId,
  //   manga,
  //   chapter
  // )
  const cachedChapters = await collection('chapters').find({ id: { $in: chapter.map(({ id }) => id) } }, 'id').exec()
  const keyboard = [
    []
  ]
  if (withChapters) {
    const chapters = groupBy(
      chapter,
      'lang_code'
    )
    for (const code of Object.keys(chapters)) {
      const cachedChaptersLength = chapters[code]
        .reduce((acc, v) => {
          if (!acc.some(x => v.chapter === x.chapter)) acc.push(v)
          return acc
        }, [])
        .filter(el => cachedChapters.some(ch => ch.toObject().id === el.id)).length
      const obj = {
        text: `${cachedChaptersLength === chapters[code].length ? `⬇` : cachedChaptersLength ? `↻ (${cachedChaptersLength}/${chapters[code].length})` : ''} Read in ${loadLangCode(code)}`,
        callback_data: `${list ? `list=${list}:` : ''}chapterlist=${code}:id=${mangaId}:offset=0${list ? '' : `:${history}`}`
      }
      if (keyboard[keyboard.length - 1].length < 2) {
        keyboard[keyboard.length - 1].push(obj)
      } else {
        keyboard.push([obj])
      }
    }
    if (manga.links['mal']) {
      keyboard.unshift(
        [
          {
            text: 'Track reading on MAL',
            url: `https://myanimelist.net/manga/${manga.links['mal']}`
          }
        ]
      )
    }
  }
  keyboard.unshift(
    [
      {
        text: buttons.back,
        callback_data: list ? `list=${list}` : history
      },
      {
        text: buttons.page.refresh(),
        callback_data: `${list ? `list=${list}:` : ''}manga=${mangaId}${list ? '' : `:${history}`}`
      }
    ]
  )
  keyboard.unshift(
    [
      {
        text: favorite ? `Unfavorite ${buttons.favorite(false)}` : `Favorite title ${buttons.favorite()}`,
        callback_data: `favorite:${mangaId}`
      },
      {
        text: buttons.share,
        switch_inline_query: `manga:${mangaId}`
      }
    ]
  )
  return {
    manga,
    chapter,
    text: templates.manga.view(
      mangaId,
      manga,
      queryUrl,
      Boolean(chapter),
      list ? `<b>List:</b> ${getList(list.match(/([a-z]+)/i)[1])}` : ''
    ),
    extra: {
      reply_markup: {
        inline_keyboard: keyboard
      },
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }
  }
}
 /*
async function checkManga (mangaId, manga, chapters) {
  const mangaData = await collection('manga').findOne({ id: mangaId }).exec()

  if (mangaData) {
    if (mangaData.updated_at - Date.now() > 1000 * 60 * 60 * 24 * 7) {
      let edited = false
      if (mangaData.cover_url !== manga.cover_url) {
        mangaData.cover_url = manga.cover_url
        mangaData.markModified('cover_url')
        edited = true
      }
      if (mangaData.status !== manga.status) {
        mangaData.status = manga.status
        mangaData.markModified('status')
        edited = true
      }
      if (mangaData.toObject().genres.filter(el => !manga.genres.includes(el)).length) {
        mangaData.genres = manga.genres
        mangaData.markModified('genres')
        edited = true
      }
      if (mangaData.description !== manga.description) {
        mangaData.description = manga.description
        mangaData.markModified('description')
        edited = true
      }
      if (edited) {
        return mangaData.save()
      }
    }
    return undefined
  } else {
    collection('manga').create({
      id: mangaId,
      cover_url: manga.cover_url,
      last_chapter_id: chapters.reduce((acc, val, arr) => )
    })
  }
}
*/