const { AllHtmlEntities } = require('html-entities')
const { getManga } = require('../mangadex')
const { loadMangaGenre, getStatus, groupBy, loadLangCode, buttons, templates } = require('../lib')
const { decode } = new AllHtmlEntities()

const { parseInt } = Number
module.exports = async (mangaId, queryUrl, history) => {
  const { manga, chapter } = await getManga(mangaId)
  let messageText = `<a href="https://mangadex.org${manga.cover_url}">&#160;</a>\n<a href="https://mangadex.org/title/${mangaId}">${decode(manga.title)}</a>\n`
  messageText += `<b>Author:</b> <a href="https://mangadex.org/?page=search&author=${manga.author}">${manga.author}</a>\n`
  messageText += `<b>Artist:</b> <a href="https://mangadex.org/?page=search&artist=${manga.artist}">${manga.artist}</a>\n`
  messageText += `<b>Genres:</b> ${manga.genres.map(genreId => `<a href="https://mangadex.org/genre/${genreId}">${loadMangaGenre(genreId).label}</a>`).join(', ')}\n`
  messageText += `<b>Pub. status:</b> ${getStatus(manga.status)}\n`
  messageText += `<b>Language:</b> ${manga.lang_name}\n`
  messageText += `${manga.hentai ? `<b>Hentai-manga</b>\n` : ''}`
  messageText += `<a href="${queryUrl}">&#160;</a>`
  messageText += `\n<b>Updated: ${templates.date(new Date())}</b>`

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
  // console.log(keyboard)
  // for (const code of Object.keys(chapters)) {
  //   const page = chapters[code][0]
  //   if (keyboard[keyboard.length - 1].length < 5) {
  //     keyboard[keyboard.length - 1]
  //   } else {
  //     keyboard.push([page])
  //   }
  // }
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
