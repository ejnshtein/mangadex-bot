import { request, sleep } from '../lib/index.js'
import { EventEmitter } from 'events'
import { promises as fs, createWriteStream } from 'fs'
import path from 'path'
import sharp from 'sharp'

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
    await fs.mkdir(`./.tmp/${this.chapterId}`)
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
    const response = await request(url, { responseType: 'stream' })

    const { name, ext } = path.parse(url)

    const storePath = path.resolve(contentPath, `${name}${ext}`)
    const writeStream = createWriteStream(storePath)

    return new Promise((resolve, reject) => {
      response.pipe(writeStream)

      response.once('error', reject)
      response.once('close', () => {
        resolve(storePath)
      })
    })
  }

  static async resizeImage (imagePath, imageWidth) {
    const img = sharp(imagePath)
    const { size } = await fs.stat(imagePath)
    const { width } = await img.metadata()

    if (size <= 5000000) {
      return imagePath
    }

    const { name, dir } = path.parse(imagePath)

    img.resize(width - 10)

    const imgPath = path.resolve(
      dir,
      imageWidth
        ? `${name.match(/^(.+)-/i)[1]}-${width - 10}.png`
        : `${name}${width - 10}.png`
    )

    await img.toFileimgPath

    return Downloader.resizeImage(imgPath, width - 10)
  }
}
