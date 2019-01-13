const Composer = require('telegraf/composer')
const composer = new Composer()
const {
  AllHtmlEntities
} = require('html-entities')
const {
  decode
} = new AllHtmlEntities()
const {
  onlyPrivate
} = require('../middlewares')
const {
  search
} = require('../mangadex')
const {
  buttons,
  templates
} = require('../lib')

composer.hears(/\/search (\S+)/i, onlyPrivate, async ctx => {
  const query = ctx.match[1]
  const searchResult = await search(query, 'title', {
    p: 1
  })

  const keyboard = searchResult.titles
    .slice(0, 10)
    .map(manga => (
      [{
        text: decode(manga.title),
        callback_data: `manga=${manga.id}:p=${1}:o=${0}`
      }]
    )
    )

  keyboard.unshift([{
    text: buttons.offset.plus(10),
    callback_data: `p=${1}:o=${10}`
  }])
  const pageLine = [
    {
      text: buttons.page.locate(1),
      callback_data: `p=${1}:o=${0}`
    },
    {
      text: buttons.page.next(2),
      callback_data: `p=${2}:o=0`
    },
    {
      text: buttons.page.nextDub(3),
      callback_data: `p=${3}:o=0`
    }
  ]
  keyboard.unshift(pageLine)
  const searchUrl = `https://mangadex.org/?page=search&title=${query}`
  ctx.reply(templates.searchText(searchUrl, query, 1, 0), {
    reply_markup: {
      inline_keyboard: keyboard
    },
    disable_web_page_preview: true,
    parse_mode: 'HTML'
  })
})

module.exports = app => {
  app.use(composer.middleware())
}
