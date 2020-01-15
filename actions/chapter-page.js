import Telegraf from 'telegraf-esm'
import Mangadex from 'mangadex-api'
import { templates, setCurrentlyReading } from '../lib/index.js'
import { addToQueue } from '../caching/index.js'
import { bot } from '../core/bot.js'
import collection from '../core/database/index.js'
const { Composer } = Telegraf
const composer = new Composer()
const mangadexClient = new Mangadex({
  shareMangaCache: true,
  shareChapterCache: true
})

composer.action(
  /^chapter=(\S+):read=(\S+):copy=(\S+):offset=(\S+?):(\S+)$/i,
  async ctx => {
    // console.log(ctx.match)
    const chapterId = ctx.match[1]
    const markedRead = ctx.match[2] === 'true'
    const copy = ctx.match[3] === 'true'
    const offset = ctx.match[4]
    const history = ctx.match[5]

    return chapterPage({ ctx, chapterId, markedRead, copy, offset, history })
  })

composer.action(
  /^list=(\S+?):chapter=(\S+):read=(\S+):copy=(\S+):offset=([0-9]+)/i,
  async ctx => {
    // console.log(ctx.match)
    const list = ctx.match[1]
    const chapterId = ctx.match[2]
    const markedRead = ctx.match[3] === 'true'
    const copy = ctx.match[4] === 'true'
    const offset = ctx.match[5]
    const history = ctx.match[6]

    return chapterPage({ ctx, list, chapterId, markedRead, copy, offset, history })
  })

async function chapterPage ({ ctx, list, chapterId, markedRead, copy, offset, history }) {
  const chapter = await mangadexClient.getChapter(chapterId)
  const { manga } = await mangadexClient.getManga(chapter.manga_id, false)

  const chapterInDb = await collection('chapters').findOne({ id: chapter.id }).exec()

  if (!chapterInDb) {
    addToQueue({
      id: chapter.id,
      pages: chapter.page_array,
      chapter,
      manga,
      from: ctx.from,
      ctx
    })
  } else {
    const keyboard = [
      [
        {
          text: markedRead ? 'Mark unread' : 'Mark read',
          callback_data: `read:${chapterId}`
        },
        {
          text: 'Instant View',
          url: chapterInDb.telegraph
        },
        {
          text: 'Share',
          switch_inline_query: `chapter:${chapterId}`
        }, {
          text: '🔗',
          callback_data: `sharechapter=${chapterId}`
        }
      ],
      [
        {
          text: 'Chapter list',
          callback_data: `${list ? `list=${list}:` : ''}chapterlist=${chapter.lang_code}:id=${chapter.manga_id}:offset=${offset}${list ? '' : `:${history}`}`
        },
        {
          text: 'Manga description',
          callback_data: `${list ? `list=${list}:` : ''}manga=${chapter.manga_id}${list ? '' : `:${history}`}`
        },
        {
          text: 'Copy',
          callback_data: `${list ? `list=${list}:` : ''}chapter=${chapterId}:read=${ctx.match[2]}:copy=true:offset=${offset}${list ? '' : `:${history}`}`
        }
      ],
      ...(
        manga.links &&
        manga.links.mal
          ? [
            [
              {
                text: 'Track reading on MAL',
                url: `https://myanimelist.net/manga/${manga.links.mal}`
              }
            ]
          ]
          : []
      )
    ]
    const messageText = templates.manga.chapter(
      chapterInDb,
      manga,
      ctx.callbackQuery.message,
      list
        ? `<b>List:</b> ${list.match(/([a-z]+)/i)[1]}`
        : ''
    )
    if (copy) {
      ctx.reply(messageText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      })
    } else {
      ctx.editMessageText(messageText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard
        }
      })
    }
    ctx.answerCbQuery('')
    setCurrentlyReading(chapter.manga_id, chapterId, ctx.state.user)
  }
}

bot.use(composer.middleware())
