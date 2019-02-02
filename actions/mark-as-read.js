const Composer = require('telegraf/composer')
const composer = new Composer()

composer.action(/read:([0-9]+)/i, async ctx => {
  const result = await markRead(ctx.state.user, ctx.match[1])
  ctx.answerCbQuery(result)
})

module.exports = app => {
  app.use(composer.middleware())
}

async function markRead (user, chapterId) {
  chapterId = typeof chapterId !== 'number' ? Number.parseInt(chapterId) : chapterId
  if (user.already_read) {
    if (user.already_read.some(el => el.chapter_id === chapterId)) {
      const chapter = user.already_read.find(el => el.chapter_id === chapterId)
      try {
        await chapter.remove()
      } catch (e) {
        return 'Something went wrong...'
      }
      user.markModified('already_read')
      await user.save()
      return 'Chapter unmarked as read'
    } else {
      user.already_read.push({
        chapter_id: chapterId
      })
    }
  } else {
    user.already_read.create({
      chapter_id: chapterId
    })
  }
  user.markModified('already_read')
  await user.save()
  return 'Chapter marked as read'
}
