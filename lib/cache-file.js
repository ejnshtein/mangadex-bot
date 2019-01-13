const Telegraph = require('telegra.ph')
const client = new Telegraph(process.env.TELEGRAPH_TOKEN)
module.exports.telegraph = (chapter, images) => {
  const imageList = images.map(el => ({
    tag: 'img',
    attrs: {
      src: `https://telegra.ph${el}`
    }
  }))

  return client.createPage(`${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}`.substr(0, 256), [{
    tag: 'h1',
    content: [`${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}`]
  }, {
    tag: 'p',
    content: [{
      tag: 'a',
      attrs: {
        href: `https://mangadex.org/title/${chapter.manga_id}`
      },
      content: ['Open manga on Mangadex']
    }]
  }, {
    tag: 'p',
    content: [{
      tag: 'a',
      attrs: {
        href: `https://mangadex.org/chapter/${chapter.id}`
      },
      content: ['Read this chapter on Mangadex']
    }]
  }].concat(imageList), 'Mangadex bot', 'https://t.me/mymanga_bot', true)
}
