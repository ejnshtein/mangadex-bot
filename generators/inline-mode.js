const { search } = require('../mangadex')

module.exports.inlineMode = (searchSegment, query, params = {}) => {
  params = {
    page: 1,
    ...params
  }
  return search(query, searchSegment, params)
}
