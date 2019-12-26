import Mangadex from 'mangadex-api'
import { buttons, templates } from '../lib/index.js'
import HtmlEntities from 'html-entities'
const { AllHtmlEntities } = HtmlEntities
const { decode } = new AllHtmlEntities()

export default async (query = '', page = 1, offset = 0) => {
  const searchResult = await Mangadex.search(query, 'title', {
    params: {
      p: page
    }
  })

  // console.log(query, page, offset)
  const keyboard = searchResult.titles
    .slice(offset, offset + 10)
    .map(manga => (
      [
        {
          text: decode(manga.title),
          callback_data: `manga=${manga.id}:p=${page}:o=${offset}`
        }
      ]
    ))

  if (offset >= 10) {
    if (offset < 30) {
      keyboard.unshift(
        [
          {
            text: buttons.offset.minus(10),
            callback_data: `p=${page}:o=${offset - 10}`
          },
          {
            text: buttons.offset.plus(10),
            callback_data: `p=${page}:o=${offset + 10}`
          }
        ]
      )
    } else {
      keyboard.unshift(
        [
          {
            text: buttons.offset.minus(10),
            callback_data: `p=${page}:o=${offset - 10}`
          }
        ]
      )
    }
  } else {
    keyboard.unshift(
      [
        {
          text: buttons.offset.plus(10),
          callback_data: `p=${page}:o=${offset + 10}`
        }
      ]
    )
  }
  const pageLine = [
    {
      text: buttons.page.locate(page),
      callback_data: `p=${page}:o=${offset}`
    }
  ]
  if (page >= 2) {
    pageLine.unshift(
      {
        text: buttons.page.prev(page - 1),
        callback_data: `p=${page - 1}:o=0`
      }
    )
  }
  if (page >= 3) {
    pageLine.unshift(
      {
        text: buttons.page.prevDub(page - 2),
        callback_data: `p=${page - 2}:o=0`
      }
    )
  }
  if (searchResult.last_page) {
    if (searchResult.last_page - 1 >= page) {
      pageLine.push(
        {
          text: buttons.page.next(page + 1),
          callback_data: `p=${page + 1}:o=0`
        }
      )
    }
    if (searchResult.last_page - 2 >= page) {
      pageLine.push(
        {
          text: buttons.page.nextDub(page + 2),
          callback_data: `p=${page + 2}:o=0`
        }
      )
    }
  }
  keyboard.unshift(pageLine)
  keyboard.unshift([
    {
      text: 'Switch to inline',
      switch_inline_query_current_chat: query
    }
  ])
  return {
    text: templates.searchText(`https://mangadex.org/search?title=${query}`, query, page, offset),
    extra: {
      reply_markup: {
        inline_keyboard: keyboard
      },
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    }
  }
}
