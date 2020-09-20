import { Composer } from '@telegraf/core'
import Mangadex from 'mangadex-api'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
import getCollection from '../../core/database/index.js'
const composer = new Composer()

composer.action(
  /^favorite:([0-9]+)$/i,
  Composer.privateChat(
    async ctx => {
      try {
        const result = await favorite(ctx.from.id, Number.parseInt(ctx.match[1]))
        await ctx.answerCbQuery(result)
      } catch (e) {
        return ctx.answerCbQuery(templates.error(e), true)
      }
    })
)

bot.use(composer.middleware())

async function favorite (userId, mangaId) {
  const result = await getCollection('mangas').aggregate(
    [
      {
        $match: {
          id: mangaId
        }
      },
      {
        $addFields: {
          is_favorited: {
            $in: [userId, '$favorited']
          }
        }
      },
      {
        $project: {
          is_favorited: 1
        }
      }
    ]
  )

  if (result.length) {
    const mangaInDb = result.pop()
    if (mangaInDb.is_favorited) {
      await getCollection('mangas').updateOne(
        { id: mangaId },
        { $pull: { favorited: userId } }
      )
      return 'Manga removed from favorite list'
    } else {
      await getCollection('mangas').updateOne(
        { id: mangaId },
        { $addToSet: { favorited: userId } }
      )
      return 'Manga added to favorite list'
    }
  } else {
    const { manga } = await Mangadex.getManga(mangaId, false)
    await getCollection('mangas').updateOne(
      { id: mangaId },
      { $set: { ...manga, favorited: [userId] } },
      { upsert: true }
    )
    return 'Manga added to favorite list'
  }
}
