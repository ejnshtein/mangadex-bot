const Telegraph = require('telegra.ph')
const client = new Telegraph(process.env.TELEGRAPH_TOKEN)
module.exports.telegraph = (chapter, images) => {
  const imageList = images.map(el => ({
    tag: 'img',
    attrs: {
      src: `https://telegra.ph${el}`
    }
  }))

  return client.createPage(
    `Chapter ${chapter.id}`,
    [{
      tag: 'h1',
      children: [`${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}`]
    }, {
      tag: 'p',
      children: [{
        tag: 'a',
        attrs: {
          href: `https://mangadex.org/title/${chapter.manga_id}`
        },
        children: ['Manga description on Mangadex']
      }]
    }, {
      tag: 'p',
      children: [{
        tag: 'a',
        attrs: {
          href: `https://mangadex.org/chapter/${chapter.id}`
        },
        children: ['This chapter on Mangadex']
      }]
    }].concat(imageList),
    'Mangadex bot',
    'https://t.me/mymanga_bot',
    true
  )
}
