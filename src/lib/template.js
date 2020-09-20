import storeHistory from './store-history.js'
import HtmlEntities from 'html-entities'
import argv from '../lib/argv.js'
import loadLangCode from './load-lang-code.js'
const { AllHtmlEntities } = HtmlEntities
const { decode } = new AllHtmlEntities()
const templates = {
  searchText: (url, query, page, offset) =>
    `<a href="${url}">${url}</a>\n\n${
      query ? `Search keyword: ${query}\n` : ''
    }Page: ${page}\nOffset: ${offset}\n\n<b>${templates.updated()}</b><a href="${url}">&#8203;</a>`,
  updated: () => `🗘 Updated ${templates.date(new Date())}`,
  date: (date = new Date()) =>
    `${date.toISOString().replace(/-/gi, '.').replace('T', ' ').slice(0, 23)}`,
  manga: {
    view(mangaId, manga, url, withChapters) {
      let messageText = `<a href="${
        manga.cover_url
      }">&#8203;</a><a href="https://mangadex.org/title/${mangaId}">${decode(
        manga.title
      )}</a>\n\n`
      if (!withChapters) {
        messageText += '<b>Without chapters</b>\n\n'
      }
      messageText += `<b>Author:</b> <a href="https://mangadex.org/search?author=${manga.author}">${manga.author}</a>\n`
      messageText += `<b>Artist:</b> <a href="https://mangadex.org/search?artist=${manga.artist}">${manga.artist}</a>\n`
      messageText += `<b>Genres:</b> ${manga.genres
        .map(
          (genre) =>
            `<a href="https://mangadex.org/genre/${genre.id}">${genre.label}</a>`
        )
        .join(', ')}\n`
      messageText += `<b>Pub. status:</b> ${manga.status_text}\n`
      messageText += `<b>Language:</b> ${manga.lang_name}\n`
      messageText += `${manga.hentai ? '<b>Hentai-manga</b>\n' : ''}`
      if (url) {
        messageText += `<a href="${url}">&#8203;</a>`
      }
      messageText += `\n<b>Updated: ${templates.date(new Date())}</b>`
      return messageText
    },
    chapter(chapter, manga = null, message = null, list) {
      let messageText = `${list ? `${list}\n\n` : ''}${
        chapter.telegraph ? `<a href="${chapter.telegraph}">&#8203;</a>` : ''
      }<a href="https://mangadex.org/chapter/${
        chapter.id
      }">Read on Mangadex</a>\n`
      messageText += `${decode(manga.title)} ${
        chapter.volume ? `Vol. ${chapter.volume} ` : ''
      }Ch. ${chapter.chapter}`
      messageText += `${
        chapter.title ? `\n\n<b>Chapter title:</b> ${chapter.title}` : ''
      }\n${
        message
          ? storeHistory(message)
          : '<a href="https://mangadex.org/search?title=">&#8203;</a>'
      }`
      return messageText
    },
    inlineMangaView(mangaId, manga) {
      let messageText = `<a href="${
        manga.cover_url
      }">&#8203;</a><b>Title:</b> <a href="https://mangadex.org/title/${mangaId}">${decode(
        manga.title
      )}</a>\n\n`
      messageText += `<b>Genres:</b> ${manga.genres
        .map(
          (genre) =>
            `<a href="https://mangadex.org/genre/${genre.id}">${genre.label}</a>`
        )
        .join(', ')}\n`
      messageText += `<b>Pub. status:</b> ${manga.status_text}\n`
      return messageText
    },
    inlineQuery(manga) {
      let messageText = `<b>Title:</b> <a href="https://mangadex.org/title/${
        manga.id
      }">${decode(manga.title)}</a>\n\n`
      messageText += `<b>Rating:</b> ${manga.rating.value}\n`
      messageText += `<b>Views:</b> ${manga.views}`
      return messageText
    },
    viewPublic(mangaId, manga) {
      const messageText = `<b>Title:</b> <a href="https://mangadex.org/title/${mangaId}">${decode(
        manga.title
      )}</a>`
      return messageText
    },
    readingListView(titlesLength, offset) {
      let messageText = `Here's your <b>reading titles</b> list.\n`
      messageText += `<b>Offset:</b> ${offset}\n`
      messageText += `<b>Total titles:</b> ${titlesLength}\n`
      messageText += `<b>Timestamp:</b> ${templates.date()}`
      return messageText
    },
    favoriteListView(titlesLength, offset) {
      let messageText = `Here's your <b>favorite titles</b> list.\n`
      messageText += `<b>Offset:</b> ${offset}\n`
      messageText += `<b>Total titles:</b> ${titlesLength}\n`
      messageText += `<b>Timestamp:</b> ${templates.date()}`
      return messageText
    }
  },
  chapter: {
    formatChapter(chapter) {
      return `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${
        chapter.chapter
      }`
    },
    channel(chapter, manga, telegraph) {
      let messageText = `<a href="${telegraph}">&#8203;</a>`
      messageText += `<a href="https://mangadex.org/title/${
        chapter.manga_id
      }">${manga.title}</a> <a href="https://mangadex.org/chapter/${
        chapter.id
      }">${templates.chapter.formatChapter(chapter)} in ${loadLangCode(
        chapter.lang_code
      )}</a> has been added to database!`
      return messageText
    }
  },
  error(e) {
    if (argv('--dev')) {
      console.log(e)
    }
    return `Something went wrong...\n\n${e.message}`
  }
}

export default templates
