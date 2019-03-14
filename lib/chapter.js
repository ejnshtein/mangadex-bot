const Telegram = require('telegraf/telegram')
const client = new Telegram(process.env.BOT_TOKEN)
const collection = require('../core/database')
const telegraphUpload = require('./telegraph-upload')
const Page = require('./page')
const { getLangName } = require('mangadex-api').default
const { templates, buffer } = require('../lib')
const { EventEmitter } = require('events')
let blockCaching = false
let blockUpdateCache = false

// {
//   [undefined]: {
//     total: 0,
//     cached: 0,
//     progress: 0
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
            chapter,
            manga,
            me,
            cachedChapter.telegraph
          )
        )
      } else {
        const updatingChapter = new Chapter(
          chapter,
          manga,
          me
        )
        if (updating.has(chapter.id)) {
          updatingChapter.destroy()
          return
        } else {
          if (blockUpdateCache) { return }
        }

        updating.set(chapter.id, updatingChapter)

        updatingChapter.cache()

        updatingChapter.once('done', async () => {
          updating.delete(chapter.id)
          await collection('chapters').updateOne({ id: chapter.id }, { $set: { telegraph: updatingChapter.telegraph, timestamp: chapter.timestamp } }).exec()
          updatingChapter.destroy()
        })
        return resolve(updatingChapter)
      }
    } else {
      if (blockCaching) {
        return reject(new Error(`Sorry, caching isn't available right now.\nThis can be because of bot update or malfunction.`))
      }
      if (caching.has(chapter.id)) {
        return resolve(caching.get(chapter.id))
      }
      const cachingChapter = new Chapter(
        chapter,
        manga,
        me
      )
      caching.set(chapter.id, cachingChapter)

      cachingChapter.once('done', () => {
        caching.delete(chapter.id)
      })

      return resolve(cachingChapter)
    }
  })

module.exports.updatingCount = () => {
  return updating.size
}
module.exports.cachingCount = () => {
  return caching.size
}

module.exports.getCacheBlockingValue = () => blockCaching
module.exports.setCachingBlocking = value => {
  blockCaching = value
}
module.exports.getUpdateCachingBlockingValue = () => blockUpdateCache
module.exports.setUpdateCachingBlocking = value => {
  blockUpdateCache = value
}

class Chapter extends EventEmitter {
  constructor (chapter, manga, me, telegraph = undefined) {
    super()

    this.chapter = chapter
    this.manga = manga
    this.me = me
    this.cached = 0
    this.total = chapter.page_array.length
    this.destroyed = false
    this.caching = false
    this.done = false

    if (telegraph) {
      this.telegraph = telegraph
      this.done = true
    }

    this.pages = chapter.page_array.map(url => new Page(this, url))
    this.cachedPages = []
  }

  get telegraph () {
    return this._telegraph
  }

  set telegraph (value) {
    this._done = Boolean(value)
    this._telegraph = value
  }

  get progress () {
    return (this.cached / this.total).toFixed(3)
  }

  async cache () {
    if (this.destroyed) { return }
    if (this.done) {
      this.emit('done')
      return
    }
    if (this.caching) {
      return new Promise((resolve, reject) => {
        const onError = err => reject(err)
        const onDone = () => {
          this.removeListener('error', onError)
          resolve()
        }
        this.once('done', onDone)
        this.once('error', onError)
      })
    }

    this.caching = true
    for (const page of this.pages) {
      if (this.destroyed) { return }
      if (page.destroyed) { throw new Error(`Page ${page.name} destroyed`) }

      this.emit('downloading', { name: page.name, url: page.url, id: this.cached + 1 })

      try {
        await page.download()
      } catch (e) {
        this.emit('error', e)
        return Promise.reject(e)
      }

      this.emit('downloaded', { name: page.name, url: page.url, id: this.cached + 1 })

      if (this.destroyed) { return }
      if (page.destroyed) { throw new Error(`Page ${page.name} destroyed`) }

      this.emit('uploading', { name: page.name, url: page.url, id: this.cached + 1 })

      let url
      try {
        url = await page.upload()
      } catch (e) {
        this.emit('error', e)
        return Promise.reject(e)
      }

      this.emit('uploaded', { name: page.name, url: page.url, id: this.cached + 1 })

      this.cached++
      this.cachedPages.push(url)
      // page.destroy()
    }
    let telegraph
    try {
      telegraph = await telegraphUpload(
        this.chapter,
        this.manga,
        this.cachedPages,
        this.me
      )
    } catch (e) {
      this.emit('error', e)
      return Promise.reject(e)
    }
    this.telegraph = telegraph.url
    client.sendMessage(
      process.env.CACHE_ID,
      `<a href="${this.telegraph}">&#8203;</a><a href="https://mangadex.org/chapter/${this.chapter.id}">${templates.chapter.formatChapter(this.chapter)} in ${this.chapter.lang_name}</a> has been added to database!
Manga: <a href="https://mangadex.org/title/${this.chapter.manga_id}">${this.manga.title}</a>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Manga info',
                url: `https://t.me/${this.me}?start=${buffer.encode(`manga:${this.chapter.manga_id}`)}`
              }
            ]
          ]
        }
      }
    )
    this.done = true
    this.emit('done')
    return this.telegraph
  }

  destroy () {
    this.destroyed = true
    this.chapter = null
    return Promise.all(this.pages.map(page => page.destroy()))
  }
}

// module.exports = Chapter
