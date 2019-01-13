const { getUrlInMessage } = require('./')

module.exports = (message, page, offset) => {
  // console.log(message,page,offset)
  const entity = getUrlInMessage(message)
  page = Number.parseInt(page)
  offset = Number.parseInt(offset)
  const location = new URL(entity.url)
  const searchParams = {
    history: `p=${page}:o=${offset}`,
    offset: offset
  }
  let searchSegment = ''
  if (location.searchParams.has('title')) {
    searchParams.title = location.searchParams.get('title')
    searchSegment = 'title'
  } else if (location.searchParams.has('author')) {
    searchParams.author = location.searchParams.get('author')
    searchSegment = 'author'
  } else if (location.searchParams.has('artist')) {
    searchParams.artist = location.searchParams.get('artist')
    searchSegment = 'artist'
  }
  return {
    params: searchParams,
    segment: searchSegment,
    value: location.searchParams.get(searchSegment)
  }
}
