const loadMangaGenre = require('./load-manga-genre')
const getStatus = require('./get-status')
const storeHistory = require('./store-history')
const { AllHtmlEntities } = require('html-entities')
const { decode } = new AllHtmlEntities()
const templates = {
  searchText: (url, query, page, offset) => `<a href="${url}">${url}</a>\n\n${query ? `Search keyword: ${query}\n` : ''}Page: ${page}\nOffset: ${offset}\n\n<b>${templates.updated()}</b><a href="${url}">&#160;</a>`,
  updated: () => `🗘 Updated ${templates.date(new Date())}`,
  date: (date = new Date()) => `${date.toISOString().replace(/-/i, '.').replace('T', ' ').slice(0, 23)}`,
  manga: {
    view (mangaId, manga, url) {
      let messageText = `<a href="https://mangadex.org${manga.cover_url}">&#160;</a>\n<a href="https://mangadex.org/title/${mangaId}">${decode(manga.title)}</a>\n`
      messageText += `<b>Author:</b> <a href="https://mangadex.org/?page=search&author=${manga.author}">${manga.author}</a>\n`
      messageText += `<b>Artist:</b> <a href="https://mangadex.org/?page=search&artist=${manga.artist}">${manga.artist}</a>\n`
      messageText += `<b>Genres:</b> ${manga.genres.map(genreId => `<a href="https://mangadex.org/genre/${genreId}">${loadMangaGenre(genreId).label}</a>`).join(', ')}\n`
      messageText += `<b>Pub. status:</b> ${getStatus(manga.status)}\n`
      messageText += `<b>Language:</b> ${manga.lang_name}\n`
      messageText += `${manga.hentai ? `<b>Hentai-manga</b>\n` : ''}`
      messageText += `<a href="${url}">&#160;</a>`
      messageText += `\n<b>Updated: ${templates.date(new Date())}</b>`
      return messageText
    },
    chapter (chapter, message) {
      let messageText = `${chapter.telegraph ? `<a href="${chapter.telegraph}">&#160;</a>` : ''}<a href="https://mangadex.org/chapter/${chapter.id}">Read on Mangadex</a>\n`
      messageText += `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}\n`
      messageText += `${chapter.title ? `\n<b>Chapter title:</b> ${chapter.title}` : ''}\n${storeHistory(message)}`
      messageText += `<b>Updated: ${templates.date()}</b>`
      return messageText
    }
  }
}
module.exports = templates
