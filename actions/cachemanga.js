const Composer = require('telegraf/composer')
const composer = new Composer()
const { getManga, getChapter, getLangName } = require('mangadex-api').default
const cacheChapter = require('../lib/cache-chapter')
// const { get } = require('../lib')

const cachePool = {}

composer.action(/^cachemanga=(\S+):lang=(\S+)$/i, async ctx => {
  if (!ctx.from.id === Number.parseInt(process.env.ADMIN_ID)) return ctx.answerCbQuery('No.')
  const lang = ctx.match[2]
  const mangaId = ctx.match[1]
  if (cachePool[mangaId]) {
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
  if (!ctx.from.id === Number.parseInt(process.env.ADMIN_ID)) return ctx.answerCbQuery('No.')
  const lang = ctx.match[2]
  const mangaId = ctx.match[1]
  if (cachePool[mangaId]) {
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
  cachePool[mangaId] = 0
  const { chapter: chapters, manga } = await getManga(mangaId)

  const chapterstemp = chapters
    .filter(el => el.lang_code === lang)

  const cachedChapters = await ctx.db('chapters').find({ id: { $in: chapterstemp.map(el => el.id) } }, 'id').exec()

  const uncachedChapters = chapterstemp.filter(el => !cachedChapters.some(chap => chap.toObject().id === el.id)).map(el => el.id)
  await uploadChapter(mangaId, lang, manga, uncachedChapters, 0, ctx)
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
  if (typeof cachePool[ctx.match[1]] === 'number') {
    cachePool[ctx.match[1]] = false
  }
})

module.exports = app => {
  app.use(composer.middleware())
}

async function uploadChapter (mangaId, lang, manga, chapters, id, ctx) {
  if (typeof cachePool[mangaId] === 'boolean' && !cachePool[mangaId]) {
    delete cachePool[mangaId]
    return
  }
  if (!chapters[id]) {
    delete cachePool[mangaId]
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
  const chapter = await getChapter(chapters[id])
  const cacheResult = await cacheChapter(chapter, manga, ctx, undefined, undefined, undefined, true)
  if (!cacheResult.ok) {
    ctx.reply(`Chapter ${chapter.chapter} caching error: ${cacheResult.message}`)
  }
  if (typeof cachePool[mangaId] === 'boolean' && !cachePool[mangaId]) {
    delete cachePool[mangaId]
    return
  }
  cachePool[mangaId] = cachePool[mangaId] + 1
  try {
    await ctx.telegram.editMessageText(
      ctx.callbackQuery.message.chat.id,
      ctx.callbackQuery.message.message_id,
      undefined,
      `Chapter ${chapter.chapter} cached.\nTotal: ${cachePool[mangaId]}/${chapters.length}`, {
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
  return uploadChapter(mangaId, lang, manga, chapters, id + 1, ctx)
}
