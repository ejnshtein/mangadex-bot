const Composer = require('telegraf/composer')
const composer = new Composer()
const { search, getManga } = require('mangadex-api').default
const { buffer, templates } = require('../lib')
const { AllHtmlEntities } = require('html-entities')
const { decode } = new AllHtmlEntities()
const { chapterView } = require('../generators')

composer.inlineQuery(/^manga:([0-9]+)$/i, async ({ match, me, inlineQuery, answerInlineQuery }) => {
  if (inlineQuery.offset && inlineQuery.offset === '1') { return answerInlineQuery([], queryOptions()) }
  const mangaId = match[1]
  try {
    var { manga } = await getManga(mangaId)
  } catch (e) {
    return answerInlineQuery(sendError(e), queryOptions())
  }
  manga.description = manga.description.replace(/\[url=(\S+?)\](\S+?)\[\/url\]/ig, `<a href="$1">$2</a>`)
  // console.log(manga, mangaId)
  try {
    await answerInlineQuery(
      [
        {
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
              [
                {
                  text: 'Read manga',
                  url: `https://t.me/${me}?start=${buffer.encode(`manga:${mangaId}`)}`
                }
              ]
            ]
          },
          thumb_url: manga.cover_url
        }
      ],
      queryOptions(`Read ${decode(manga.title)}`, match[0])
    )
  } catch (e) {
    return answerInlineQuery(sendError(e), queryOptions())
  }
})

composer.inlineQuery(/^chapter:([0-9]+)$/i, async ({ match, me, inlineQuery, answerInlineQuery }) => {
  if (inlineQuery.offset && inlineQuery.offset === '1') { return answerInlineQuery([], queryOptions()) }
  const chapterId = match[1]
  try {
    var {
      chapter,
      manga: {
        manga
      },
      text
    } = await chapterView(chapterId)
  } catch (e) {
    return answerInlineQuery(sendError(e), queryOptions())
  }
  try {
    await answerInlineQuery(
      [
        {
          type: 'article',
          id: chapterId,
          title: `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter} ${decode(manga.title)}`,
          description: manga.description,
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
                  url: `https://t.me/${me}?start=${buffer.encode(`chapter:${chapterId}`)}`
                }
              ]
            ]
          },
          thumb_url: chapter.page_array[0]
        }
      ],
      queryOptions(`Read ${decode(manga.title)}`, match[0])
    )
  } catch (e) {
    return answerInlineQuery(sendError(e), queryOptions())
  }
})

composer.on('inline_query', async ctx => {
  const { query } = ctx.inlineQuery
  let { offset } = ctx.inlineQuery
  if (offset && offset === '1') {
    return ctx.answerInlineQuery([], queryOptions(undefined, query))
  }
  offset = offset ? Number.parseInt(offset) : 1
  // console.log(offset)
  // console.log(query, offset)
  try {
    var searchResult = await search(query, 'title', { params: { p: offset } })
  } catch (e) {
    return ctx.answerInlineQuery(sendError(e), queryOptions())
  }
  // console.log(searchResult.titles.length)
  const result = searchResult.titles.map(title =>
    ({
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
          [
            {
              text: 'Read manga',
              url: `https://t.me/${ctx.me}?start=${buffer.encode(`manga:${title.id}`)}`
            }
          ]
          // ,[
          //   {
          //     text: 'Want to read',
          //     callback_data: `test:1`
          //   }
          // ]
        ]
      },
      thumb_url: title.image_url
    })
  )
  try {
    await ctx.answerInlineQuery(result, queryOptions(undefined, query, `${result.length >= 40 ? offset + 1 : 1}`))
  } catch (e) {
    return ctx.answerInlineQuery(sendError(e), queryOptions(undefined, query))
  }
})

// composer.action(/test:(\S+)/i, async ctx => {
//   console.log(ctx.update)
//   ctx.answerCbQuery('Hello there!')
// })

module.exports = app => {
  app.use(composer.middleware())
}

function sendError (error) {
  console.log(error)
  return [
    {
      type: 'article',
      id: '1',
      title: 'Error!',
      description: 'Something went wrong. Try again later, or change request query.',
      input_message_content: {
        message_text: `Error!\n\nSomething went wrong. Try again later, or change request query.`
      }
    }
  ]
}

function queryOptions (switchPmText = 'Search manga', query = '', offset = '1', cacheTime = 5, isPersonal = false) {
  return Object.assign({},
    switchPmText ? {
      switch_pm_text: switchPmText,
      switch_pm_parameter: `${buffer.encode(`search:${query.substr(0, 64)}`)}`
    } : {},
    offset ? {
      next_offset: offset
    } : {},
    cacheTime ? {
      cache_time: cacheTime
    } : {},
    isPersonal ? {
      is_personal: isPersonal
    } : {})
}
