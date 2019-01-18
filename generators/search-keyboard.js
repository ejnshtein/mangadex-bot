const { search } = require('mangadex-api')
const { AllHtmlEntities } = require('html-entities')
const { decode } = new AllHtmlEntities()
module.exports = (params) => search(params)
  .then(response => {
    params = Object.assign({
      history: 'p=1:o=0'
    }, params)
    const keyboard = []
    let line = []
    const offsetted = response.slice(params.offset, params.offset + 10)
    if (offsetted.length > 0) {
      offsetted.forEach(el => {
        const text = decode(el.title)
        const callback_data = `manga=${el.id}:${params.history}`
        if (line.length < 1) {
          line.push({
            text,
            callback_data
          })
        } else {
          keyboard.push(line)
          line = []
          line.push({
            text,
            callback_data
          })
        }
      })
      keyboard.push(line)
    }
    return keyboard
  })
