const Composer = require('telegraf/composer')
const composer = new Composer()

composer.action(/favorite:([0-9]+)/i, async ctx => {
  const result = await favorite(ctx.state.user, ctx.match[1])
  ctx.answerCbQuery(result)
})

module.exports = app => {
  app.use(composer.middleware())
}

async function favorite (user, mangaId) {
  mangaId = typeof mangaId !== 'number' ? Number.parseInt(mangaId) : mangaId
  if (user.favorite_titles) {
    if (user.favorite_titles.some(el => el.manga_id === mangaId)) {
      const manga = user.favorite_titles.find(el => el.manga_id === mangaId)
      try {
        await manga.remove()
      } catch (e) {
        return 'Something went wrong...'
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
