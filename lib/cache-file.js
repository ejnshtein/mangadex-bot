const Telegraph = require('telegra.ph')
const client = new Telegraph(process.env.TELEGRAPH_TOKEN)
const { getManga } = require('mangadex-api')
const buffer = require('./buffer')
module.exports.telegraph = async (chapter, manga, images, botUsername) => {
  const imageList = images.map(el => ({
    tag: 'img',
    attrs: {
      src: `https://telegra.ph${el}`
    }
  }))

  const mangaTitle = manga.manga.title

  return client.createPage(
    `Chapter ${chapter.id}`,
    [{
      tag: 'h1',
      children: [`${mangaTitle} ${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}`]
    }, {
      tag: 'br'
    }, {
      tag: 'a',
      children: ['Manga description on ']
    }, {
      tag: 'a',
      attrs: {
        href: `https://mangadex.org/title/${chapter.manga_id}`
      },
      children: ['Mangadex']
    }, {
      tag: 'a',
      children: [' and in ']
    }, {
      tag: 'a',
      attrs: {
        href: `https://t.me/${botUsername}?start=${buffer.encode(`manga:${chapter.manga_id}`)}`
      },
      children: ['Mangadex bot']
    }, {
      tag: 'br'
    }, {
      tag: 'a',
      attrs: {
        href: `https://mangadex.org/chapter/${chapter.id}`
      },
      children: ['This chapter on Mangadex']
    }].concat(imageList),
    'Mangadex bot',
    'https://t.me/mymanga_bot',
    true
  )
}
