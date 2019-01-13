const getUrlInMessage = require('./get-url-in-message')

module.exports = message => `<a href="${getUrlInMessage(message).url || 'https://mangadex.org/search?title='}">&#160;</a>`
