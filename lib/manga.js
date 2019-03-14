const Mangadex = require('mangadex-api').default
const mangadexClient = new Mangadex({
  shareChapterCache: true,
  shareMangaCache: true
})
const Chapter = require('./chapter')
const { EventEmitter } = require('events')

// const cachePool = new Map()

// const CachingProgress = new CachingManga(22723, {title: 'Senko san', ...}, 'gb', [{id: 8857, ...}, ...])

class Manga extends EventEmitter {
  constructor (mangaId, manga, lang, chapters, me) {
    super()

    this.id = typeof mangaId === 'number' ? mangaId : Number.parseInt(mangaId)
    this.lang = lang
    this.chapters = chapters
    this.manga = manga
    this.me = me
    this.destroyed = false
    this.caching = false
    this.cached = 0
    this.total = chapters.length
    this.done = false

    this.cachedChapters = []
  }

  get progress () {
    return (this.cached / this.chapters.length).toFixed(3)
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

    for (const chapter of this.chapters) {
      if (this.destroyed) { return }
      let chapterData
      try {
        chapterData = await mangadexClient.getChapter(chapter.id)
      } catch (e) {
        this.emit('error', e)
        continue
      }
      if (this.destroyed) { return }
      let cachingChapter
      try {
        cachingChapter = await Chapter(chapterData, this.manga, this.me)
      } catch (e) {
        this.emit('error', e)
        continue
      }

      this.emit('chapterCaching', cachingChapter)

      if (this.destroyed) { return }
      try {
        await cachingChapter.cache()
      } catch (e) {
        this.emit('error', e)
        continue
      }
      if (this.destroyed) { return }
      this.cached++
      if (!cachingChapter.telegraph) {
        this.emit('error', new Error(`No telegraph link for chapter ${chapterData.chapter}`))
        continue
      }
      const chapterDbData = {
        id: chapter.id,
        telegraph: cachingChapter.telegraph,
        timestamp: chapterData.timestamp,
        manga_id: chapterData.manga_id,
        manga_title: this.manga.title,
        title: chapterData.title,
        volume: chapterData.volume,
        chapter: chapterData.chapter,
        lang: chapterData.lang_code
      }
      this.cachedChapters.push(chapterDbData)
      this.emit('chapterCached', chapterDbData)
    }

    this.done = true
    this.emit('done')
    return true
  }

  destroy () {
    this.destroyed = true
    this.emit('destroy')
  }
}

module.exports = Manga

// async function uploadChapter (mangaId, lang, manga, id) {
//   // if (cachePool.has(`${mangaId}:${lang}`) && cachePool.get(`${mangaId}:${lang}`).stoped === true) {
//   //   cachePool.delete(`${mangaId}:${lang}`)
//   //   return ctx.telegram.editMessageText(
//   //     ctx.callbackQuery.message.chat.id,
//   //     ctx.callbackQuery.message.message_id,
//   //     undefined,
//   //     'Chapter caching canceled', {
//   //       reply_markup: {
//   //         inline_keyboard: [
//   //           [
//   //             {
//   //               text: `Resume caching`,
//   //               callback_data: `cachemangafull=${ctx.match[1]}:lang=${ctx.match[2]}`
//   //             }
//   //           ]
//   //         ]
//   //       }
//   //     })
//   // }
//   const chapters = cachePool.get(`${mangaId}:${lang}`)
//   if (!chapters.chapters[id]) {
//     cachePool.delete(`${mangaId}:${lang}`)
//     return ctx.telegram.editMessageText(
//       ctx.callbackQuery.message.chat.id,
//       ctx.callbackQuery.message.message_id,
//       undefined,
//       `"${manga.title}" in ${Mangadex.getLangName(lang)} has been fully cached.`, {
//         reply_markup: {
//           inline_keyboard: [
//             [
//               {
//                 text: 'OK',
//                 callback_data: 'delete'
//               }
//             ]
//           ]
//         }
//       })
//   }
//   const chapter = await mangadexClient.getChapter(chapters.chapters[id])
//   try {
//     var telegraphLink = await cacheSingleChapter(
//       ctx.callbackQuery.message.chat.id,
//       ctx.callbackQuery.message.message_id,
//       lang,
//       chapter,
//       manga,
//       ctx.me,
//       `${mangaId}:${lang}`
//     )
//   } catch (e) {
//     // cachePool.delete(`${mangaId}:${lang}`)
//     ctx.telegram.sendMessage(
//       ctx.callbackQuery.message.chat.id,
//       `Chapter ${chapter.chapter} caching error: ${e.message}`
//     )
//   }
//   if (telegraphLink) {
//     await collection('chapters').create({
//       id: chapter.id,
//       telegraph: telegraphLink,
//       timestamp: chapter.timestamp,
//       manga_id: chapter.manga_id,
//       manga_title: manga.title,
//       title: chapter.title,
//       volume: chapter.volume,
//       chapter: chapter.chapter,
//       lang: chapter.lang_code
//     })
//     chapters.cached++
//     try {
//       await ctx.telegram.editMessageText(
//         ctx.callbackQuery.message.chat.id,
//         ctx.callbackQuery.message.message_id,
//         undefined,
//         `Chapter ${chapter.chapter} cached.\nTotal: ${chapters.cached}/${chapters.chapters.length}`, {
//           reply_markup: {
//             inline_keyboard: [
//               [
//                 {
//                   text: 'Cancel caching',
//                   callback_data: `endcaching=${mangaId}:lang=${lang}`
//                 }
//               ]
//             ]
//           }
//         })
//     } catch (e) {
//       console.log(e)
//     }
//   }
//   return uploadChapter(mangaId, lang, manga, id + 1, ctx)
// }

// const cacheSingleChapter = (chatId, messageId, lang, chapter, manga, me, id) => new Promise(async (resolve, reject) => {
//   const queue = emitChapterStatusPool()
//   try {
//     var chapterCaching = await cacheChapter(chapter, manga, me)
//   } catch (e) {
//     return reject(new Error(`Chapter ${chapter.chapter} caching error: ${e.message}`))
//   }
//   cachePool.get(id).events.on('stopCaching', () => {
//     reject(new Error('Caching canceled'))
//     client.deleteMessage(msg.chat.id, msg.message_id)
//     chapterCaching.emit('stopCaching')
//     chapterCaching.off('error', onError)
//     chapterCaching.off('done', onDone)
//     chapterCaching.off('pictureCached', pictureCached)
//     chapterCaching = null
//   })
//   const msg = await client.sendMessage(chatId, `Starting caching chapter ${chapter.chapter}`, {
//     reply_to_message_id: messageId
//   })
//   const onDone = () => {
//     client.deleteMessage(msg.chat.id, msg.message_id)
//     resolve(chapterCaching.telegraph)
//     chapterCaching = null
//     chapterCaching.off('error', onError)
//     chapterCaching.off('pictureCached', pictureCached)
//   }
//   chapterCaching.on('done', onDone)

//   const onError = e => {
//     reject(e)
//     client.deleteMessage(msg.chat.id, msg.message_id)
//     chapterCaching.off('done', onDone)
//     chapterCaching.off('pictureCached', pictureCached)
//     chapterCaching = null
//   }
//   chapterCaching.on('error', onError)

//   const pictureCached = ({ total, cached }) => {
//     queue(msg.chat.id, msg.message_id, `Chapter ${chapter.chapter} caching.\nCached ${cached} of ${total} pictures.`, {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: 'Cancel caching',
//               callback_data: `endcaching=${chapter.manga_id}:lang=${lang}`
//             }
//           ]
//         ]
//       }
//     })
//   }
//   chapterCaching.on('pictureCached', pictureCached)
// })

// const emitChapterStatusPool = () => {
//   let blocked = false
//   setInterval(() => {
//     blocked = false
//   }, 2500)

//   return async (chatId, messageId, message) => {
//     if (blocked) { return }
//     blocked = true
//     try {
//       await client.editMessageText(
//         chatId,
//         messageId,
//         undefined,
//         message
//       )
//     } catch (e) {}
//   }
// }
