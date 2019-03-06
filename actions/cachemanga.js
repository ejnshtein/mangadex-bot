const { Telegram, Composer } = require('telegraf')
const composer = new Composer()
const client = new Telegram(process.env.BOT_TOKEN)
const Mangadex = require('mangadex-api').default
const mangadexClient = new Mangadex()
const cacheChapter = require('../lib/cache-chapter')
const collection = require('../core/database')
const { EventEmitter } = require('events')
// const { get } = require('../lib')

const cachePool = new Map()

composer.action(/^cachemanga=(\S+):lang=(\S+)$/i, async ctx => {
  if (!ctx.from.id === process.env.ADMIN_ID) return ctx.answerCbQuery('No.')
  const lang = ctx.match[2]
  const mangaId = Number.parseInt(ctx.match[1])
  if (cachePool.has(`${mangaId}:${lang}`)) {
    return ctx.answerCbQuery(`This manga already caching`)
  }
  ctx.answerCbQuery('')

  const { chapter } = await mangadexClient.getManga(mangaId)

  const chapters = chapter
    .filter(el => el.lang_code === lang)

  const cachedChapters = await ctx.db('chapters').find({ id: { $in: chapters.map(el => el.id) } }, 'id').exec()

  const uncachedChapters = chapters.filter(el => !cachedChapters.some(chap => chap.toObject().id === el.id))

  return ctx.reply(`Here's ${uncachedChapters.length} uncached chapters.`, {
    reply_to_message_id: ctx.callbackQuery.message.message_id,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Cache all',
            callback_data: `cachemangafull=${ctx.match[1]}:lang=${ctx.match[2]}`
          }
        ]
      ]
    }
  })
})

composer.action(/^cachemangafull=(\S+):lang=(\S+)$/i, async ctx => {
  if (!ctx.from.id === process.env.ADMIN_ID) return ctx.answerCbQuery('No.')
  const lang = ctx.match[2]
  const mangaId = Number.parseInt(ctx.match[1])
  if (cachePool.has(`${mangaId}:${lang}`)) {
    return ctx.answerCbQuery(`This manga already caching`)
  }
  ctx.answerCbQuery('')
  ctx.editMessageText('Manga caching started', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Cancel caching',
            callback_data: `endcaching=${ctx.match[1]}:lang=${ctx.match[2]}`
          }
        ]
      ]
    }
  })
  cachePool.set(`${mangaId}:${lang}`, {
    stoped: false,
    cached: 0,
    chapters: [],
    events: new EventEmitter()
  })
  const { chapter: chapters, manga } = await mangadexClient.getManga(mangaId)

  const chapterstemp = chapters
    .filter(el => el.lang_code === lang)

  const cachedChapters = await ctx.db('chapters').find({ id: { $in: chapterstemp.map(el => el.id) } }, 'id').exec()

  const uncachedChapters = chapterstemp.filter(el => !cachedChapters.some(chap => chap.toObject().id === el.id)).map(el => el.id)
  cachePool.get(`${mangaId}:${lang}`).chapters = uncachedChapters
  uploadChapter(mangaId, lang, manga, 0, ctx)
})

composer.action(/^endcaching=(\S+):lang=(\S+)$/i, async ctx => {
  ctx.answerCbQuery('')
  ctx.editMessageText('Chapter caching canceled', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `Resume caching`,
            callback_data: `cachemangafull=${ctx.match[1]}:lang=${ctx.match[2]}`
          }
        ]
      ]
    }
  })
  if (cachePool.has(`${ctx.match[1]}:${ctx.match[2]}`)) {
    cachePool.get(`${ctx.match[1]}:${ctx.match[2]}`).stoped = true
    cachePool.get(`${ctx.match[1]}:${ctx.match[2]}`).events.emit('stopCaching')
  }
})

module.exports = app => {
  app.use(composer.middleware())
}

async function uploadChapter (mangaId, lang, manga, id, ctx) {
  if (cachePool.has(`${mangaId}:${lang}`) && cachePool.get(`${mangaId}:${lang}`).stoped === true) {
    cachePool.delete(`${mangaId}:${lang}`)
    return ctx.telegram.editMessageText(
      ctx.callbackQuery.message.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      'Chapter caching canceled', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Resume caching`,
                callback_data: `cachemangafull=${ctx.match[1]}:lang=${ctx.match[2]}`
              }
            ]
          ]
        }
      })
  }
  const chapters = cachePool.get(`${mangaId}:${lang}`)
  if (!chapters.chapters[id]) {
    cachePool.delete(`${mangaId}:${lang}`)
    return ctx.telegram.editMessageText(
      ctx.callbackQuery.message.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      `"${manga.title}" in ${Mangadex.getLangName(lang)} has been fully cached.`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'OK',
                callback_data: 'delete'
              }
            ]
          ]
        }
      })
  }
  const chapter = await mangadexClient.getChapter(chapters.chapters[id])
  try {
    var telegraphLink = await cacheSingleChapter(
      ctx.callbackQuery.message.chat.id,
      ctx.callbackQuery.message.message_id,
      lang,
      chapter,
      manga,
      ctx.me,
      `${mangaId}:${lang}`
    )
  } catch (e) {
    // cachePool.delete(`${mangaId}:${lang}`)
    ctx.telegram.sendMessage(
      ctx.callbackQuery.message.chat.id,
      `Chapter ${chapter.chapter} caching error: ${e.message}`)
  }
  if (telegraphLink) {
    await collection('chapters').create({
      id: chapter.id,
      telegraph: telegraphLink,
      timestamp: chapter.timestamp,
      manga_id: chapter.manga_id,
      manga_title: manga.title,
      title: chapter.title,
      volume: chapter.volume,
      chapter: chapter.chapter,
      lang: chapter.lang_code
    })
    chapters.cached++
    try {
      await ctx.telegram.editMessageText(
        ctx.callbackQuery.message.chat.id,
        ctx.callbackQuery.message.message_id,
        undefined,
        `Chapter ${chapter.chapter} cached.\nTotal: ${chapters.cached}/${chapters.chapters.length}`, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Cancel caching',
                  callback_data: `endcaching=${mangaId}:lang=${lang}`
                }
              ]
            ]
          }
        })
    } catch (e) {
      console.log(e)
    }
  }
  return uploadChapter(mangaId, lang, manga, id + 1, ctx)
}

const cacheSingleChapter = (chatId, messageId, lang, chapter, manga, me, id) => new Promise(async (resolve, reject) => {
  const queue = emitChapterStatusPool()
  try {
    var chapterCaching = await cacheChapter(chapter, manga, me)
  } catch (e) {
    return reject(new Error(`Chapter ${chapter.chapter} caching error: ${e.message}`))
  }
  cachePool.get(id).events.on('stopCaching', () => {
    reject(new Error('Caching canceled'))
    client.deleteMessage(msg.chat.id, msg.message_id)
    chapterCaching.emit('stopCaching')
    chapterCaching.off('error', onError)
    chapterCaching.off('done', onDone)
    chapterCaching.off('pictureCached', pictureCached)
    chapterCaching = null
  })
  const msg = await client.sendMessage(chatId, `Starting caching chapter ${chapter.chapter}`, {
    reply_to_message_id: messageId
  })
  const onDone = () => {
    client.deleteMessage(msg.chat.id, msg.message_id)
    resolve(chapterCaching.telegraph)
    chapterCaching = null
    chapterCaching.off('error', onError)
    chapterCaching.off('pictureCached', pictureCached)
  }
  chapterCaching.on('done', onDone)

  const onError = e => {
    reject(e)
    client.deleteMessage(msg.chat.id, msg.message_id)
    chapterCaching.off('done', onDone)
    chapterCaching.off('pictureCached', pictureCached)
    chapterCaching = null
  }
  chapterCaching.on('error', onError)

  const pictureCached = ({ total, cached }) => {
    queue(msg.chat.id, msg.message_id, `Chapter ${chapter.chapter} caching.\nCached ${cached} of ${total} pictures.`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Cancel caching',
              callback_data: `endcaching=${chapter.manga_id}:lang=${lang}`
            }
          ]
        ]
      }
    })
  }
  chapterCaching.on('pictureCached', pictureCached)
})

const emitChapterStatusPool = () => {
  let blocked = false
  setInterval(() => {
    blocked = false
  }, 2500)

  return async (chatId, messageId, message) => {
    if (blocked) { return }
    blocked = true
    try {
      await client.editMessageText(
        chatId,
        messageId,
        undefined,
        message
      )
    } catch (e) {}
  }
}
