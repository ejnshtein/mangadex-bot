import { Composer } from '@telegraf/core'
import Mangadex from 'mangadex-api'
import { buffer, templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const composer = new Composer()
const mangadexClient = new Mangadex({ shareMangaCache: true, shareChapterCache: true })

composer.action(/^sharemanga=(\S+)$/i, async ctx => {
  let manga
  try {
    manga = await mangadexClient.getManga(ctx.match[1])
  } catch (e) {
    return ctx.answerCbQuery(templates.error(e), true)
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
    return ctx.answerCbQuery(templates.error(e), true)
  }
  ctx.answerCbQuery('')
  ctx.reply(
    `Here's share link for ${templates.chapter.formatChapter(chapter)}!
    
    https://t.me/${ctx.me}?start=${buffer.encode(`chapter:${ctx.match[1]}`)}`
  )
})

bot.use(composer.middleware())
