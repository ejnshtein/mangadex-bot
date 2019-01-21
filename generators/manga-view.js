const { getManga } = require('mangadex-api')
const { templates, groupBy, loadLangCode, buttons } = require('../lib')

module.exports = async (mangaId, queryUrl = 'https://mangadex.org/search?title=', history = 'p=1:o=0') => {
  const { manga, chapter } = await getManga(mangaId, false)
  const messageText = templates.manga.view(mangaId, manga, queryUrl)

  const chapters = groupBy(Object.keys(chapter).map(id => ({ ...chapter[id], id })), 'lang_code')
  const keyboard = [[]]
  for (const code of Object.keys(chapters)) {
    const obj = {
      text: loadLangCode(code),
      callback_data: `chapterlist=${code}:id=${mangaId}:offset=0:${history}`
    }
    if (keyboard[keyboard.length - 1].length < 2) {
      keyboard[keyboard.length - 1].push(obj)
    } else {
      keyboard.push([obj])
    }
  }
  keyboard.unshift([
    {
      text: buttons.back,
      callback_data: `${history}`
    },
    {
      text: buttons.page.refresh(),
      callback_data: `manga=${mangaId}:${history}`
    }
  ])
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
