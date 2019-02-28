const { Telegram, Composer } = require('telegraf')
const composer = new Composer()
const client = new Telegram(process.env.BOT_TOKEN)
const { getManga, getChapter, getLangName } = require('mangadex-api').default
const cacheChapter = require('../lib/cache-chapter')
const collection = require('../core/database')
// const { get } = require('../lib')

const cachePool = new Map()

composer.action(/^cachemanga=(\S+):lang=(\S+)$/i, async ctx => {
  if (!ctx.from.id === process.env.ADMIN_ID) return ctx.answerCbQuery('No.')
  const lang = ctx.match[2]
  const mangaId = Number.parseInt(ctx.match[1])
  if (cachePool.has(mangaId)) {
    return ctx.answerCbQuery(`This manga already caching`)
  }
  ctx.answerCbQuery('')

  const { chapter } = await getManga(mangaId)

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
  if (cachePool.has(mangaId)) {
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
  cachePool.set(mangaId, {
    stoped: false,
    cached: 0,
    chapters: []
  })
  const { chapter: chapters, manga } = await getManga(mangaId)

  const chapterstemp = chapters
    .filter(el => el.lang_code === lang)

  const cachedChapters = await ctx.db('chapters').find({ id: { $in: chapterstemp.map(el => el.id) } }, 'id').exec()

  const uncachedChapters = chapterstemp.filter(el => !cachedChapters.some(chap => chap.toObject().id === el.id)).map(el => el.id)
  cachePool.get(mangaId).chapters = uncachedChapters
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
  if (cachePool.has(Number(ctx.match[1]))) {
    cachePool.get(Number(ctx.match[1])).stoped = true
  }
})

module.exports = app => {
  app.use(composer.middleware())
}

async function uploadChapter (mangaId, lang, manga, id, ctx) {
  if (cachePool.has(mangaId) && cachePool.get(mangaId).stoped === true) {
    cachePool.delete(mangaId)
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
  const chapters = cachePool.get(mangaId)
  if (!chapters.chapters[id]) {
    cachePool.delete(mangaId)
    return ctx.telegram.editMessageText(
      ctx.callbackQuery.message.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      `"${manga.title}" in ${getLangName(lang)} has been fully cached.`, {
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
  const chapter = await getChapter(chapters.chapters[id])
  try {
    var telegraphLink = await cacheSingleChapter(
      ctx.callbackQuery.message.chat.id,
      ctx.callbackQuery.message.message_id,
      lang,
      chapter,
      manga,
      ctx.me
    )
  } catch (e) {
    return ctx.telegram.editMessageText(
      ctx.callbackQuery.message.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      `Chapter ${chapter.chapter} caching error: ${e.message}`)
  }
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
  return uploadChapter(mangaId, lang, manga, id + 1, ctx)
}

const cacheSingleChapter = (chatId, messageId, lang, chapter, manga, me) => new Promise(async (resolve, reject) => {
  const queue = emitChapterStatusPool()
  try {
    var chapterCaching = await cacheChapter(chapter, manga, me)
  } catch (e) {
    return reject(new Error(`Chapter ${chapter.chapter} caching error: ${e.message}`))
  }
  const msg = await client.sendMessage(chatId, `Starting caching chapter ${chapter.chapter}`, {
    reply_to_message_id: messageId
  })
  chapterCaching.on('done', () => {
    client.deleteMessage(msg.chat.id, msg.message_id)
    resolve(chapterCaching.telegraph)
  })
  chapterCaching.on('error', reject)

  chapterCaching.on('pictureCached', ({ total, cached }) => {
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
  })
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
