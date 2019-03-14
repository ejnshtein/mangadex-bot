const Composer = require('telegraf/composer')
const composer = new Composer()
const Mangadex = require('mangadex-api').default
const mangadexClient = new Mangadex({ shareMangaCache: true, shareChapterCache: true })
const { buffer, templates } = require('../lib')

composer.action(/^sharemanga=(\S+)$/i, async ctx => {
  let manga
  try {
    manga = await mangadexClient.getManga(ctx.match[1])
  } catch (e) {
    return ctx.answerCbQuery(e.message)
  }
  ctx.answerCbQuery('')
  ctx.reply(
    `Here's share link for "${manga.manga.title}"!
    
    https://t.me/${ctx.me}?start=${buffer.encode(`manga:${ctx.match[1]}`)}`
  )
})

composer.action(/^sharechapter=(\S+)$/i, async ctx => {
  let chapter
  try {
    chapter = await mangadexClient.getChapter(ctx.match[1])
  } catch (e) {
    return ctx.answerCbQuery(e.message)
  }
  ctx.answerCbQuery('')
  ctx.reply(
    `Here's share link for ${templates.chapter.formatChapter(chapter)}!
    
    https://t.me/${ctx.me}?start=${buffer.encode(`chapter:${ctx.match[1]}`)}`
  )
})

module.exports = app => {
  app.use(composer.middleware())
}
