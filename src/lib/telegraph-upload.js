import Telegraph from 'telegra.ph'
import buffer from './buffer.js'
import env from '../env.js'
const client = new Telegraph(env.TELEGRAPH_TOKEN)

export default async function telegraphUpload ({
  chapter,
  manga,
  pages,
  username = 'mymanga_bot'
}) {
  return client.createPage(
    `Chapter ${chapter.id}${chapter.title ? ` "${chapter.title}"` : ''}`,
    [
      {
        tag: 'h1',
        children: [`${manga.title} ${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Ch. ${chapter.chapter}`]
      },
      {
        tag: 'br'
      },
      {
        tag: 'a',
        children: ['View description on ']
      },
      {
        tag: 'a',
        attrs: { href: `https://mangadex.org/title/${chapter.manga_id}` },
        children: ['Mangadex']
      },
      {
        tag: 'a',
        children: [' or in ']
      },
      {
        tag: 'a',
        attrs: { href: `https://t.me/${username}?start=${buffer.encode(`manga:${chapter.manga_id}`)}` },
        children: ['Mangadex bot']
      },
      {
        tag: 'br'
      },
      {
        tag: 'a',
        attrs: { href: `https://mangadex.org/chapter/${chapter.id}` },
        children: ['This chapter on Mangadex']
      }
    ].concat(
      pages.map(page => ({
        tag: 'img',
        attrs: { src: `https://telegra.ph${page}` }
      }))
    ).concat(
      [
        {
          tag: 'a',
          children: ['Thanks for reading this chapter!']
        },
        {
          tag: 'br'
        },
        {
          tag: 'a',
          children: ['You can always support my projects on ']
        },
        {
          tag: 'a',
          attrs: { href: 'https://github.com/ejnshtein' },
          children: ['Github']
        },
        {
          tag: 'a',
          children: ['.']
        }
      ]
    ),
    'Mangadex bot',
    'https://t.me/mymanga_bot',
    true
  )
}
