// docs: https://nodejs.org/dist/latest-v10.x/docs/api/https.html#https_https_request_url_options_callback
// all methods working, but post only with x-form-urlencoded. return promise with resolved object on line 64.
// extra options parameters: json=[bool], params=[object]
import qs from 'querystring'
import https from 'https'
import http from 'http'

const cleanObject = (object, filterKeys) => Object.keys(object)
  .reduce((acc, key) => {
    if (filterKeys.includes(key)) {
      return {
        ...acc,
        [key]: object[key]
      }
    }
    return acc
  }, {})

const mergeUrl = (url, searchParams) => {
  const urlInst = new URL(url)
  const params = new URLSearchParams(searchParams)
  params.forEach((val, key) => {
    urlInst.searchParams.set(key, val)
  })
  return urlInst.toString()
}

/**
 *
 * @param {string} url Url for request
 * @param {object} options Request options
 * @param {object} [formData] Request formdata
 */
export default function request (url, options, formData) {
  let data
  if (formData) {
    data = qs.stringify(formData)
  }
  if (options.params && typeof options.params === 'object') {
    url = mergeUrl(url, options.params)
  }
  if (options.headers && data) {
    options.headers = Object.assign(options.headers, { 'Content-Length': Buffer.byteLength(data) })
  }
  options.headers = Object.assign(options.headers || {}, {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) snap Chromium/78.0.3904.70 Chrome/78.0.3904.70 Safari/537.36'
  })
  return new Promise((resolve, reject) => {
    function resHandler (res) {

      if (options.responseType === 'stream') {
        return resolve(res)
      }

      res.setEncoding('utf8')
      let data = ''

      const onData = chunk => {
        data += chunk
      }
      const onError = err => {
        res.removeListener('error', onError)
        res.removeListener('data', onData)
        reject(err)
      }
      const onClose = () => {
        res.removeListener('error', onError)
        res.removeListener('data', onData)
        res.removeListener('close', onClose)
        if (options.json) {
          try {
            data = JSON.parse(data)
          } catch (e) {
            return reject(new Error(`JSON parsing error: ${e.message}: ${data}`))
          }
        }
        resolve({
          data,
          headers: res.headers,
          status: res.statusCode,
          statusText: res.statusMessage
        })
        data = null
      }
      res.on('data', onData)
      res.on('error', onError)
      res.on('close', onClose)
    }
    const req = url.startsWith('https') ? https.request(
      url,
      cleanObject(options, ['protocol', 'host', 'hostname', 'family', 'port', 'localAddres', 'socketPath', 'method', 'path', 'auth', 'agent', 'createConnection', 'timeout']),
      resHandler
    ) : http.request(
      url,
      cleanObject(options, ['protocol', 'host', 'hostname', 'family', 'port', 'localAddres', 'socketPath', 'method', 'path', 'auth', 'agent', 'createConnection', 'timeout']),
      resHandler
    )
    if (options.headers) {
      Object.keys(options.headers).forEach(header => {
        req.setHeader(header, options.headers[header])
      })
    }
    const onError = err => {
      req.removeListener('error', onError)
      reject(err)
    }
    req.on('error', onError)
    if (data) {
      req.write(data)
    }
    req.end()
  })
}
