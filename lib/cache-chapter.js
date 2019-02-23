const axios = require('axios').default
const collection = require('../core/database')
const telegraphUpload = require('./telegraph-upload')
const sharp = require('sharp')
const FormData = require('form-data')
const { EventEmitter } = require('events')
let blockCaching = false
let blockUpdateCache = false

// {
//   [undefined]: {
//     total: 0,
//     cached: 0,
//     progress: 0,
//     users: new Map([undefined, {
//       offset: 0,
//       history: 'p=1:o=0',
//       messageId: undefined
//     }])
//   }
// }

const caching = new Map()

const updating = new Map()

module.exports = (chapter, manga, me) =>
  new Promise(async (resolve, reject) => {
    const cachedChapter = await collection('chapters').findOne({ id: chapter.id }).exec()
    if (cachedChapter) {
      if (cachedChapter.timestamp === chapter.timestamp) {
        return resolve(
          new Chapter(
            chapter.page_array.length,
            cachedChapter.telegraph
          )
        )
      } else {
        resolve(
          new Chapter(
            chapter.page_array.length,
            cachedChapter.telegraph
          )
        )
        if (updating.has(chapter.id)) {
          return
        } else {
          if (blockUpdateCache) { return }
        }
        const uploadedChapter = await uploadChapter('updating', chapter, manga, me)

        uploadChapter.on('done', async () => {
          await collection('chapters').updateOne({ id: chapter.id }, { $set: { telegraph: uploadedChapter.telegraph, timestamp: chapter.timestamp } }).exec()
        })
      }
    } else {
      if (blockCaching) {
        return reject(new Error(`Sorry, caching isn't available right now.\nThis can be because of bot update or malfunction.`))
      }
      if (caching.has(chapter.id)) {
        return resolve(caching.get(chapter.id))
      }
      const uploadedChapter = await uploadChapter('updating', chapter, manga, me)
      return resolve(uploadedChapter)
    }
  })

module.exports.cachePoolSize = function () { return caching.size }
module.exports.updatePoolSize = function () { return updating.size }
module.exports.getCacheBlockingValue = () => blockCaching
module.exports.setCachingBlocking = value => {
  blockCaching = value
}
module.exports.getUpdateCachingBlockingValue = () => blockUpdateCache
module.exports.setUpdateCachingBlocking = value => {
  blockUpdateCache = value
}

const uploadChapter = (mode, chapter, manga, me) => new Promise(async resolve => {
  const block = mode === 'caching' ? caching : updating
  if (!block.has(chapter.id)) {
    const cachingChapter = new Chapter(
      chapter.page_array.length
    )
    block.set(chapter.id, cachingChapter)
    resolve(cachingChapter)
  } else {
    return resolve(block.get(chapter.id))
  }
  const chapterData = block.get(chapter.id)
  let stopCaching = false
  chapterData.on('stopCaching', () => {
    stopCaching = true
  })
  const pics = []
  for (const img of chapter.page_array) {
    if (stopCaching) {
      chapterData.emit('stopCaching')
      return
    }
    try {
      var buffer = await downloadImage(img)
    } catch (e) {
      chapterData.emit('error', new Error(`Picture ${chapterData.cached + 1} caching error: ${e}`))
      return
    }
    const pic = sharp(buffer)
    const meta = await pic.metadata()
    try {
      var file = await uploadChapterPhoto(0, img, meta.size > 5e6 ? 1500 : meta.width, pic)
    } catch (e) {
      chapterData.emit('error', new Error(`Picture ${chapterData.cached + 1} uploading error: ${e}`))
      return
    }
    chapterData.emit('pictureCached', { total: chapterData.total, cached: chapterData.cached + 1 })
    pics.push(file)
    buffer = null
    chapterData.cached++
  }
  try {
    var telegraph = await telegraphUpload(chapter, manga, pics, me)
  } catch (e) {
    chapterData.emit('error', new Error(`Telegraph uploading error: ${e}`))
    return
  }
  chapterData.telegraph = telegraph.url
  chapterData.emit('done')
  block.delete(chapter.id)
})

async function uploadChapterPhoto (deep = 0, img, size, pic) {
  if (deep >= 6) throw new Error(`Too many unsuccess upload tries`)
  pic.resize(size - 100 * deep)
  let buff = await pic.toBuffer()
  let file
  try {
    file = await uploadFile({ name: img, file: buff })
  } catch (e) {
    return uploadChapterPhoto(deep + 1, img, size, pic)
  }
  if (file.error) {
    return uploadChapterPhoto(deep + 1, img, size, pic)
  } else {
    buff = null
    return file[0].src
  }
}

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))

const downloadImage = url => axios.get(url, {
  responseType: 'arraybuffer'
})
  .then(({ data }) => Buffer.from(data))

async function uploadFile (file) {
  const form = new FormData()
  form.append(`data`, file.file, {
    filename: file.name
  })
  return new Promise((resolve, reject) => {
    form.submit('https://telegra.ph/upload', (err, res) => {
      if (err) return reject(err)
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', reject)
    })
  })
}

class Chapter extends EventEmitter {
  constructor (total, telegraph = undefined) {
    super()
    this._cached = 0
    this.total = total
    this._telegraph = telegraph
    this._done = Boolean(telegraph)
  }

  get isDone () {
    return this._done
  }

  get telegraph () {
    return this._telegraph
  }

  set telegraph (value) {
    this._done = Boolean(value)
    this._telegraph = value
  }

  get cached () {
    return this._cached
  }

  set cached (value) {
    this._cached = value
  }

  get progress () {
    return (this._cached / this.total).toFixed(3)
  }
}
