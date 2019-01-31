const Composer = require('telegraf/composer')
const composer = new Composer()
const { search, getManga } = require('mangadex-api')
const { buffer, templates } = require('../lib')
const { AllHtmlEntities } = require('html-entities')
const { decode } = new AllHtmlEntities()
const { chapterView } = require('../generators')

composer.on('inline_query', async ctx => {
  const { query } = ctx.inlineQuery
  let { offset } = ctx.inlineQuery
  if (offset && Number.parseInt(offset) === 1) {
    return ctx.answerInlineQuery([], {
      cache_time: 5,
      switch_pm_text: 'Search manga',
      switch_pm_parameter: `${buffer.encode(`search:${query.substr(0, 64)}`)}`,
      next_offset: `${offset}`
    })
  }
  offset = offset ? Number.parseInt(offset) : 1
  // console.log(offset)
  // console.log(query, offset)

  let result
  switch (true) {
    case /^manga:([0-9]+)$/i.test(query):
      const mangaId = query.match(/^manga:([0-9]+)$/i)[1]
      const { manga } = await getManga(mangaId)
      manga.description = manga.description.replace(/\[url=(\S+?)\](\S+?)\[\/url\]/ig, `<a href="$1">$2</a>`)
      // console.log(manga, mangaId)
      result = [{
        type: 'article',
        id: mangaId,
        title: decode(manga.title),
        description: manga.description,
        input_message_content: {
          message_text: templates.manga.inlineMangaView(mangaId, manga),
          disable_web_page_preview: false,
          parse_mode: 'HTML'
        },
        reply_markup: {
          inline_keyboard: [
            [{
              text: 'Read manga',
              url: `https://t.me/${ctx.me}?start=${buffer.encode(`manga:${mangaId}`)}`
            }]
          ]
        },
        thumb_url: manga.cover_url
      }]
      offset = 0
      break
    case /^chapter:([0-9]+)$/i.test(query):
      const chapterId = query.match(/^chapter:([0-9]+)$/i)[1]
      const { chapter, manga: mangaChapter, text } = await chapterView(chapterId)
      result = [{
        type: 'article',
        id: chapterId,
        title: `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter} ${decode(mangaChapter.manga.title)}`,
        description: mangaChapter.manga.description,
        input_message_content: {
          message_text: text,
          disable_web_page_preview: false,
          parse_mode: 'HTML'
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Desktop Instant View',
                url: chapter.telegraph
              },
              {
                text: 'Read manga',
                url: `https://t.me/${ctx.me}?start=${buffer.encode(`chapter:${chapterId}`)}`
              }
            ]
          ]
        },
        thumb_url: chapter.page_array[0]
      }]
      offset = 0
      break
    default:
      const searchResult = await search(query, 'title', { p: offset })
      result = searchResult.titles.map(title => {
        return {
          type: 'article',
          id: title.id.toString(),
          title: decode(title.title),
          description: title.description,
          input_message_content: {
            message_text: templates.manga.inlineQuery(title),
            disable_web_page_preview: false,
            parse_mode: 'HTML'
          },
          reply_markup: {
            inline_keyboard: [
              [{
                text: 'Read manga',
                url: `https://t.me/${ctx.me}?start=${buffer.encode(`manga:${title.id}`)}`
              }]
            ]
          },
          thumb_url: title.image_url
        }
      })
      break
  }
  // console.log(result)
  try {
    await ctx.answerInlineQuery(result, {
      cache_time: 5,
      switch_pm_text: 'Search manga',
      switch_pm_parameter: `${buffer.encode(`search:${query.substr(0, 64)}`)}`,
      next_offset: `${result.length === 50 ? offset + 1 : 1}`
    })
  } catch (e) {
    console.log(e)
  }
})

module.exports = app => {
  app.use(composer.middleware())
}
