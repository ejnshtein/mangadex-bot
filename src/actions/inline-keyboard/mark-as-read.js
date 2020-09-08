import { Composer } from '@telegraf/core'
import { templates } from '../../lib/index.js'
import { bot } from '../../core/bot.js'
import getCollection from '../../core/database/index.js'

const composer = new Composer()

composer.action(/read:([0-9]+)/i, async ctx => {
  try {
    const result = await markRead(ctx.from.id, Number.parseInt(ctx.match[1]))
    await ctx.answerCbQuery(result)
  } catch (e) {
    return ctx.answerCbQuery(templates.error(e), true)
  }
})

bot.use(composer.middleware())

async function markRead (userId, chapterId) {
  const result = await getCollection('chapters').aggregate(
    [
      {
        $match: {
          id: chapterId
        }
      },
      {
        $addFields: {
          is_read: {
            $in: [userId, '$read']
          }
        }
      },
      {
        $project: {
          is_read: 1
        }
      }
    ]
  )
  if (result.length) {
    const chapterInDb = result.pop()
    if (chapterInDb.is_read) {
      await getCollection('chapters').updateOne(
        { id: chapterId },
        { $pull: { read: userId } }
      )
      return 'Chapter unmarked as read'
    } else {
      await getCollection('chapters').updateOne(
        { id: chapterId },
        { $addToSet: { read: userId } }
      )
      return 'Chapter marked as read'
    }
  } else {
    return 'Chapter is not cached yet, try again later...'
  }
}
