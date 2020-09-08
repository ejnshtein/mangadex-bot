import getUrlInMessage from './get-url-in-message.js'

export default message => {
  let link = 'https://mangadex.org/search?title='
  try {
    link = getUrlInMessage(message)
  } catch (e) {}
  return `<a href="${link}">&#8203;</a>`
}
