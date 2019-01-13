const Composer = require('telegraf/composer')
const composer = new Composer()
const { AllHtmlEntities } = require('html-entities')
const { decode } = new AllHtmlEntities()
const { search } = require('../mangadex')
const { buttons, templates, loadSearchParams } = require('../lib')
composer.action(/^p=(\S+):o=(\S+)$/i, async ctx => {
  ctx.answerCbQuery('')
  const page = Number.parseInt(ctx.match[1])
  const offset = Number.parseInt(ctx.match[2])
  const {
    params: searchParams,
    segment: searchSegment,
    value: searchValue
  } = loadSearchParams(ctx.callbackQuery.message, page, offset)
  const searchResult = await search(searchValue, searchSegment, { p: page })

  const keyboard = searchResult.titles
    .slice(offset, offset + 10)
    .map(manga => (
      [
        {
          text: decode(manga.title),
          callback_data: `manga=${manga.id}:p=${page}:o=${offset}`
        }
      ]
    )
    )

  if (offset >= 10) {
    if (offset < 50) {
      keyboard.unshift([{
        text: buttons.offset.minus(10),
        callback_data: `p=${page}:o=${offset - 10}`
      }, {
        text: buttons.offset.plus(10),
        callback_data: `p=${page}:o=${offset + 10}`
      }])
    } else {
      keyboard.unshift([{
        text: buttons.offset.minus(10),
        callback_data: `p=${page}:o=${offset - 10}`
      }])
    }
  } else {
    keyboard.unshift([{
      text: buttons.offset.plus(10),
      callback_data: `p=${page}:o=${offset + 10}`
    }])
  }
  const pageLine = []
  if (page >= 2) {
    pageLine.push({
      text: buttons.page.prev(page - 1),
      callback_data: `p=${page - 1}:o=0`
    })
    pageLine.push({
      text: buttons.page.locate(page),
      callback_data: `p=${page}:o=${offset}`
    })
  } else {
    pageLine.push({
      text: buttons.page.locate(page),
      callback_data: `p=${page}:o=${offset}`
    })
  }
  pageLine.push({
    text: buttons.page.next(page + 1),
    callback_data: `p=${page + 1}:o=0`
  })
  pageLine.push({
    text: buttons.page.nextDub(page + 2),
    callback_data: `p=${page + 2}:o=0`
  })
  if (page >= 3) {
    pageLine.unshift({
      text: buttons.page.prevDub(1),
      callback_data: 'p=1:o=0'
    })
  }
  keyboard.unshift(pageLine)
  const searchUrl = `https://mangadex.org/?page=search&${searchSegment}=${searchParams[searchSegment]}`
  ctx.editMessageText(templates.searchText(searchUrl, searchParams[searchSegment], page, offset), {
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
