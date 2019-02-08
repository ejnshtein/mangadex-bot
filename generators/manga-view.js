const { getManga } = require('mangadex-api').default
const { templates, groupBy, loadLangCode, buttons } = require('../lib')

module.exports = async (mangaId, queryUrl = 'https://mangadex.org/search?title=', history = 'p=1:o=0') => {
  const { manga, chapter } = await getManga(mangaId)
  const messageText = templates.manga.view(
    mangaId,
    manga,
    queryUrl
  )
  const withChapters = Boolean(chapter)

  const keyboard = [
    []
  ]
  if (withChapters) {
    const chapters = groupBy(
      chapter,
      'lang_code'
    )
    for (const code of Object.keys(chapters)) {
      const obj = {
        text: `Read in ${loadLangCode(code)}`,
        callback_data: `chapterlist=${code}:id=${mangaId}:offset=0:${history}`
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
        callback_data: `${history}`
      },
      {
        text: buttons.page.refresh(),
        callback_data: `manga=${mangaId}:${history}`
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
    text: messageText,
    extra: {
      reply_markup: {
        inline_keyboard: keyboard
      },
      parse_mode: 'HTML'
    }
  }
}
