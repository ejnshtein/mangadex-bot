import { sleep } from '../lib/index.js'
import { EventEmitter } from 'events'
import fs, { createWriteStream } from 'fs'
import path from 'path'
import sharp from 'sharp'
import request from '@ejnshtein/smol-request'

export class Downloader extends EventEmitter {
  constructor (chapterId, pages) {
    super()

    this.chapterId = chapterId
    this.pages = pages
    this.downloaded = []
  }

  get telegraph () {
    return this.done && this._telegraph
  }

  get progress () {
    return (this.downloaded.length / this.pages.length) * 100
  }

  async download () {
    await fs.promises.mkdir(`./.tmp/${this.chapterId}`)
    for (const page of this.pages) {
      const pagePath = await Downloader.pageDownload(`./.tmp/${this.chapterId}`, page)

      const finalPagePath = await Downloader.resizeImage(pagePath)

      this.downloaded.push(finalPagePath)

      this.emit('downloaded', {
        progress: this.progress,
        downloaded: this.downloaded.length,
        pages: this.pages.length
      })
      await sleep(1500)
    }
    this.emit('done', this.downloaded)
    return this.downloaded
  }

  destroy () {
    this.destroyed = true
    this.chapter = null
  }

  static async pageDownload (contentPath, url) {
    const { data: stream } = await request(url, { responseType: 'stream' })

    const { name, ext } = path.parse(url)

    const storePath = path.resolve(contentPath, `${name}${ext}`)
    const writeStream = createWriteStream(storePath)

    return new Promise((resolve, reject) => {
      stream.pipe(writeStream)
      stream.once('error', reject)
      stream.once('finish', () => {
        resolve(storePath)
      })
    })
  }

  static async resizeImage (imagePath) {
    const img = sharp(imagePath)
    const { size } = await fs.promises.stat(imagePath)

    if (size < 5e6) {
      return imagePath
    }
    const { width } = await img.metadata()

    const { name, dir, ext } = path.parse(imagePath)

    const newWidth = width - 10

    img.resize(newWidth)

    const originalName = name.split(':').shift()

    const imgPath = path.resolve(
      dir,
      `${originalName}:${newWidth}.${ext}`
    )

    await img.toFile(imgPath)

    return Downloader.resizeImage(imgPath)
  }
}
