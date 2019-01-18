const { search } = require('mangadex-api')

module.exports.inlineMode = (searchSegment, query, params = {}) => {
  params = {
    page: 1,
    ...params
  }
  return search(query, searchSegment, params)
}
