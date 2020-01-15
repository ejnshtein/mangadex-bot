import Telegraf from 'telegraf-esm'
import { templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { Composer } = Telegraf
const composer = new Composer()

composer.action(/favorite:([0-9]+)/i, async ctx => {
  const result = await favorite(ctx.state.user, ctx.match[1])
  ctx.answerCbQuery(result)
})

bot.use(composer.middleware())

async function favorite (user, mangaId) {
  mangaId = typeof mangaId !== 'number' ? Number.parseInt(mangaId) : mangaId
  if (user.favorite_titles) {
    if (user.favorite_titles.some(el => el.manga_id === mangaId)) {
      const manga = user.favorite_titles.find(el => el.manga_id === mangaId)
      try {
        await manga.remove()
      } catch (e) {
        return templates.error(e)
      }
      user.markModified('favorite_titles')
      await user.save()
      return 'Manga removed from favorite list'
    } else {
      user.favorite_titles.push({
        manga_id: mangaId
      })
    }
  } else {
    user.favorite_titles.create({
      manga_id: mangaId
    })
  }
  user.markModified('favorite_titles')
  await user.save()
  return 'Manga added to favorite list'
}
