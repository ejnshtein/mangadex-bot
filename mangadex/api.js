const axios = require('axios')
const parseSearch = require('./scraper')

const api = axios.create({
  baseURL: 'https://mangadex.org/api/'
})

module.exports = {
  getManga (mangaId, params = {}) {
    return api
      .get(`manga/${mangaId}`, {
        params
      })
      .then(response => response.data)
  },

  getChapter (chapterId, params = {}) {
    return api
      .get(`chapter/${chapterId}`, {
        params
      })
      .then(response => response.data)
  },

  search (query, searchSegment = 'title', params = {}) {
    return axios
      .get('https://mangadex.org/', {
        params: Object.assign({
          page: 'search'
        }, {
          [searchSegment]: query
        }, params)
      })
      .then(response => parseSearch(response.data))
  }
}
