import { EventEmitter } from 'events'
import fs from 'fs'
import { sleep } from '../lib/index.js'
import FormData from 'form-data'

export class Uploader extends EventEmitter {
  constructor () {
    super()

    this.uploaded = []
  }

  /**
   * @param {Array} pages
   */
  set setPages (pages) {
    this.pages = pages
  }

  get progress () {
    return (this.uploaded.length / this.pages.length) * 100
  }

  async upload () {
    if (!this.pages.length) {
      throw new Error('no pages was added')
    }

    for (const page of this.pages) {
      const result = await Uploader.uploadFile(fs.createReadStream(page))

      this.uploaded.push(result[0].src)

      this.emit('uploaded', {
        progress: this.progress,
        uploaded: this.uploaded.length,
        pages: this.pages.length
      })
      await sleep(1500)
    }

    this.emit('done', this.uploaded)

    return this.uploaded
  }

  static async uploadFile (stream) {
    const form = new FormData()
    form.append('data', stream)
    return new Promise((resolve, reject) => {
      form.submit('https://telegra.ph/upload', (err, res) => {
        if (err) return reject(err)
        const data = []
        res.on('data', chunk => {
          data.push(chunk)
        })
        res.on('end', () => {
          resolve(JSON.parse(data.join('')))
        })
        res.on('error', reject)
      })
    })
  }
}
