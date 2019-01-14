const Composer = require('telegraf/composer')
const composer = new Composer()
const { search } = require('../mangadex')
const { buffer } = require('../lib')
const { AllHtmlEntities } = require('html-entities')
const { decode } = new AllHtmlEntities()

composer.on('inline_query', async ctx => {
  const { query } = ctx.inlineQuery
  let { offset } = ctx.inlineQuery
  offset = offset ? Number.parseInt(offset) : 1
  // console.log(query, offset)
  const searchResult = await search('title', query, { p: offset })

  // console.log(searchResult, searchResult.titles)

  const result = searchResult.titles.map(title => {
    return {
      type: 'article',
      id: title.id.toString(),
      title: decode(title.title),
      description: `${title.description.slice(0, 100)}`,
      input_message_content: {
        message_text: `<a href="https://mangadex.org/title/${title.id}">${decode(title.title)}</a>`,
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
  ctx.answerInlineQuery(result, {
    cache_time: 5,
    switch_pm_text: 'Search manga',
    switch_pm_parameter: `${buffer.encode(`search:${query.slice(0, 64)}`)}`,
    next_offset: `${offset + 1}`
  })
})

module.exports = app => {
  app.use(composer.middleware())
}
