import getUrlInMessage from './get-url-in-message.js'

export default function loadSearchParams (message) {
  const entity = getUrlInMessage(message)
  const location = new URL(entity)
  let searchSegment = ''
  if (location.searchParams.has('title')) {
    searchSegment = 'title'
  } else if (location.searchParams.has('author')) {
    searchSegment = 'author'
  } else if (location.searchParams.has('artist')) {
    searchSegment = 'artist'
  }
  const value = location.searchParams.get(searchSegment) || ''
  return [searchSegment, value]
}
