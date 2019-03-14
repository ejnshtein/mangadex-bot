const { EventEmitter } = require('events')
const sharp = require('sharp')
const FormData = require('form-data')
const got = require('got')
const concat = require('concat-stream')
const path = require('path')

class Page extends EventEmitter {
  constructor (chapter, photoUrl) {
    super()

    this.percent = 0
    this._chapter = chapter
    this.destroyed = false

    this.url = photoUrl
    this.name = path.parse(photoUrl).name
    this.downloaded = false
    this.uploaded = false

    this.buffer = null
  }

  download () {
    if (this.destroyed) { return }
    if (this._chapter.destroyed) { return }
    if (this.downloaded) { throw new Error(`This page already cached.`) }

    return new Promise((resolve, reject) => {
      // this.timeout = setTimeout(() => {
      //   this.destroy()
      //   this.emit('error', new Error(`Photo downloading timeout (5 min)`))
      //   onClose()
      // }, 1000 * 60 * 5)
      this.emit('downloading')

      const stream = got.stream(this.url, { timeout: 1000 * 60 * 5 })

      const onProgress = progress => {
        this.percent = progress.percent
      }

      const onClose = () => {
        stream.removeListener('downloadProgress', onProgress)
        stream.removeListener('error', reject)
        stream.removeListener('close', onClose)
      }

      const onDestroy = cb => {
        this.removeListener('destroy', onDestroy)
        onClose()
        stream.unpipe(destin)
        stream.destroy(err => {
          if (err) return cb(err)
          return cb()
        })
      }

      stream.on('error', reject)
      stream.on('close', onClose)
      stream.on('downloadProgress', onProgress)

      this.once('destroy', onDestroy)

      const destin = concat({}, buffer => {
        this.downloaded = true
        onClose()
        this.removeListener('destroy', onDestroy)
        this.on('destroy', _ => _())
        this.buffer = buffer
        this.emit('downloaded')
        resolve()
      })
      stream.pipe(
        destin
      )
    })
  }

  async upload () {
    if (this.destroyed) { return }
    if (this._chapter.destroyed) { return }
    if (!this.downloaded) { throw new Error(`You need download this page first`) }
    if (this.uploaded) { throw new Error(`This page already uploaded`) }
    let pic = sharp(this.buffer)
    let meta = await pic.metadata()

    this.emit('uploading')

    for (let i = 0; i < 3; i++) {
      const width = i
        ? meta.width > 5e6
          ? 1500 - i * 100
          : meta.width
        : meta.width > 5e6
          ? 1500
          : meta.width
      if (width !== meta.width) {
        pic.resize(width)
      }
      let finalBuffer = await pic.toBuffer()
      let result
      try {
        result = await uploadFile({ name: this.name, file: finalBuffer })
      } catch (e) {
        continue
      }
      finalBuffer = null
      if (result) {
        if (result.error) {
          throw new Error(result.error)
        }
        this.uploaded = true
        this.buffer = null
        this.emit('uploaded')
        return result[0].src
      }
    }
    throw new Error(`Page ${this.name} unsuccessfull upload to telegra.ph server`)
  }

  destroy () {
    this.destroyed = true
    this._chapter = null
    this.buffer = null

    return new Promise((resolve, reject) => {
      this.emit('destroy', err => {
        if (err) return reject(err)
        return resolve()
      })
    })
  }
}

function uploadFile (file) {
  const form = new FormData()
  form.append('data', file.file, {
    filename: file.name
  })

  return new Promise((resolve, reject) => {
    form.submit('https://telegra.ph/upload', (err, res) => {
      if (err) return reject(err)
      let data = ''

      const onData = chunk => {
        data += chunk
      }

      const onEnd = () => {
        res.removeListener('data', onData)
        res.removeListener('error', reject)
        res.removeListener('end', onEnd)
        resolve(JSON.parse(data))
      }

      res.on('data', onData)
      res.on('end', onEnd)
      res.on('error', reject)
    })
  })
}

module.exports = Page
