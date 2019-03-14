const axios = require('axios').default
module.exports = url => axios.get(url, {
  responseType: 'arraybuffer'
})
  .then(({ data }) => Buffer.from(data))
