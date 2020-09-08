
export default async function searchMangaKeyboard (title, params = {}) {
  const searchParams = Object.assign({
    p: 1
  }, params)
  const keyboard = await searchKeyboard(title, 'title', searchParams)
  keyboard.unshift(
    [
      {
        text: buttons.offset.plus(10),
        callback_data: 'p=1:o=10'
      }
    ]
  )
  keyboard.unshift(
    [
      {
        text: buttons.page.locate(1),
        callback_data: 'p=1:o=0'
      }, {
        text: buttons.page.next(2),
        callback_data: 'p=2:o=0'
      }, {
        text: buttons.page.nextDub(3),
        callback_data: 'p=3:o=0'
      }
    ]
  )
  const searchUrl = `https://mangadex.org/?page=search&title=${title}`
  return {
    message: templates.searchText(searchUrl, title, 1, 0),
    extra: {
      reply_markup: {
        inline_keyboard: keyboard
      },
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    }
  }
}