const { Telegram, Composer } = require('telegraf')
const composer = new Composer()
const client = new Telegram(process.env.BOT_TOKEN)
const Mangadex = require('mangadex-api').default
const mangadexClient = new Mangadex()
const Manga = require('../lib/manga')
const { templates } = require('../lib')
const collection = require('../core/database')
const { EventEmitter } = require('events')
const { fromAdmin } = require('../middlewares')

const cachePool = new Map()

composer.action(/^cachemanga=(\S+):lang=(\S+)$/i,
  fromAdmin(),
  async ctx => {
    const lang = ctx.match[2]
    const mangaId = ctx.match[1]
    if (cachePool.has(`${mangaId}:${lang}`)) {
      return ctx.answerCbQuery(`This manga already caching`)
    }
    try {
      var { chapter } = await mangadexClient.getManga(mangaId)
    } catch (e) {
      return ctx.answerCbQuery(e.message)
    }

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

composer.action(/^cachemangafull=(\S+):lang=(\S+)$/i,
  fromAdmin(),
  async ctx => {
    const lang = ctx.match[2]
    const mangaId = ctx.match[1]
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
    if (cachePool.has(`${mangaId}:${lang}`)) {
      cachePool.get(`${mangaId}:${lang}`).messages.push({
        chat: ctx.chat,
        message_id: ctx.callbackQuery.message.message_id
      })
      return
    } else {
      cachePool.set(`${mangaId}:${lang}`, {
        events: new EventEmitter(),
        messages: [
          {
            chat_id: ctx.chat.id,
            message_id: ctx.callbackQuery.message.message_id
          }
        ]
      })
    }
    const { chapter: chapters, manga } = await mangadexClient.getManga(mangaId)

    const chapterstemp = chapters
      .filter(el => el.lang_code === lang)

    const cachedChapters = await ctx.db('chapters').find({ id: { $in: chapterstemp.map(el => el.id) } }, 'id').exec()
    const uncachedChapters = chapterstemp.filter(el => !cachedChapters.some(chap => chap.toObject().id === el.id)).map(el => ({ id: el.id }))
    cacheManga(mangaId, manga, lang, uncachedChapters, ctx.me)
  })

async function cacheManga (mangaId, manga, lang, chapters, me) {
  const cachingManga = new Manga(mangaId, manga, lang, chapters, me)
  let canceled = false
  cachePool.get(`${mangaId}:${lang}`).events.once('destroy', async (cb) => {
    cachingManga.destroy()
    canceled = true
    await editMessageText(
      getMessages(),
      `Caching canceled`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Resume caching`,
                callback_data: `cachemangafull=${mangaId}:lang=${lang}`
              }
            ]
          ]
        }
      }
    )
    cachePool.delete(`${mangaId}:${lang}`)
    cb()
  })
  const onError = err => {
    sendMessage(getMessages(), `Something went wrong: ${err.message}`)
  }

  const onChapterCaching = chapter => {
    const onDoneChapter = () => {
      clearListenersChapter()
      if (canceled) { return }
      editMessageText(
        getMessages(),
        `${cachingManga.manga.title}
${templates.chapter.formatChapter(chapter.chapter)} cached. (${cachingManga.cached}/${cachingManga.total})`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Cancel',
                  callback_data: `endcaching=${mangaId}:lang=${lang}`
                }
              ]
            ]
          }
        })
    }
    const onUploaded = page => {
      if (canceled) { return }
      editMessageText(
        getMessages(),
        `${cachingManga.manga.title}
${templates.chapter.formatChapter(chapter.chapter)} caching. (${cachingManga.cached}/${cachingManga.total})
Cached ${page.id} of ${chapter.total} pages.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Cancel',
                  callback_data: `endcaching=${mangaId}:lang=${lang}`
                }
              ]
            ]
          }
        }
      )
    }

    const clearListenersChapter = () => {
      chapter.removeListener('done', onDoneChapter)
      chapter.removeListener('uploaded', onUploaded)
    }

    chapter.on('uploaded', onUploaded)
    chapter.once('done', onDoneChapter)
  }

  const onDone = () => {
    clearListeners()
    if (canceled) { return }
    editMessageText(
      getMessages(),
      `${cachingManga.manga.title} fully cached in ${Mangadex.getLangName(cachingManga.lang)}`,
      {
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
      }
    )
  }

  const onChapterCached = async chapter => {
    try {
      await collection('chapters').create(chapter)
    } catch (e) {
      console.log(e)
      await sendMessage(getMessages(), `Something went wrong: ${e.message}`)
    }
  }

  const clearListeners = () => {
    cachingManga.removeListener('error', onError)
    cachingManga.removeListener('chapterCaching', onChapterCaching)
    cachingManga.removeListener('chapterCached', onChapterCached)
    cachingManga.removeListener('done', onDone)
  }

  function getMessages () {
    return cachePool.get(`${mangaId}:${lang}`).messages
  }

  cachingManga.on('error', onError)
  cachingManga.on('chapterCaching', onChapterCaching)
  cachingManga.on('done', onDone)
  cachingManga.on('chapterCached', onChapterCached)
  try {
    await cachingManga.cache()
  } catch (e) {}
}

composer.action(/^endcaching=(\S+):lang=(\S+)$/i,
  fromAdmin(),
  async ctx => {
    if (cachePool.has(`${ctx.match[1]}:${ctx.match[2]}`)) {
      cachePool.get(`${ctx.match[1]}:${ctx.match[2]}`).events.emit('destroy', () => {
        ctx.answerCbQuery('Canceled')
      })
    } else {
      ctx.answerCbQuery('')
      ctx.editMessageText(`Caching canceled`, {
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
  })

module.exports = app => {
  app.use(composer.middleware())
}

async function editMessageText (messages, text, extra = {}) {
  for (const message of messages) {
    try {
      await client.editMessageText(
        message.chat_id,
        message.message_id,
        undefined,
        text,
        extra
      )
    } catch (e) {}
    await sleep(500)
  }
}

async function sendMessage (messages, text, extra = {}) {
  for (const message of messages) {
    try {
      await client.sendMessage(
        message.chat_id,
        text,
        extra
      )
    } catch (e) {}
    await sleep(500)
  }
}

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))
