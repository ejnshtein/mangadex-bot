const Composer = require('telegraf/composer')
const composer = new Composer()
const {
  getManga
} = require('mangadex-api')
// const { buttons, storeHistory, templates } = require('../lib')

composer.action(/chapterread=(\S+):id=(\S+):offset=(\S+):(\S+)/i, async ctx => {
  const lang = ctx.match[1]
  const mangaId = ctx.match[2]
  const offset = Number.parseInt(ctx.match[3])
  const history = ctx.match[4]

  // console.log(lang, mangaId, offset)

  const { chapter } = await getManga(mangaId, false)

  const chapters = Object.keys(chapter).map(id => ({ ...chapter[id], id })).filter(el => el.lang_code === lang)
  chapters.sort((a, b) => Number.parseFloat(a.chapter) - Number.parseFloat(b.chapter))
  const slicedChapters = chapters.slice(offset, offset + 20)
  const keyboard = [[]]
  for (let chapterId = 0; chapterId < slicedChapters.length; chapterId++) {
    const chapter = slicedChapters[chapterId]
    const obj = {
      text: `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}`,
      callback_data: `chapter=${chapter.id}:prev=${slicedChapters[chapterId - 1] ? slicedChapters[chapterId].id : 'null'}:next=${slicedChapters[chapterId + 1] ? slicedChapters[chapterId].id : 'null'}:offset=${offset}:${history}`
    }
    if (keyboard[keyboard.length - 1].length < 2) {
      keyboard[keyboard.length - 1].push(obj)
    } else {
      keyboard.push([obj])
    }
  }
})

module.exports = app => {
  app.use(composer.middleware())
}
