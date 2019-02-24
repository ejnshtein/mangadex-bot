const { getManga } = require('mangadex-api').default
const { templates, groupBy, loadLangCode, buttons, getList } = require('../lib')

module.exports = async (mangaId, queryUrl = 'https://mangadex.org/search?title=', history = 'p=1:o=0', list, favorite = false) => {
  const { manga, chapter } = await getManga(mangaId)
  const messageText = templates.manga.view(
    mangaId,
    manga,
    queryUrl,
    Boolean(chapter),
    list ? `<b>List:</b> ${getList(list.match(/([a-z]+)/i)[1])}` : ''
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
    text: messageText,
    extra: {
      reply_markup: {
        inline_keyboard: keyboard
      },
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }
  }
}
