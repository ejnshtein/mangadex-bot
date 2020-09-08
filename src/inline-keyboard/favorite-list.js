import collection from '../../core/database/index.js'
import qs from 'querystring'
import { buttons, templates } from '../../lib/index.js'

export default async function favoriteListView (userId, offset = 0) {
  const chapters = await collection('chapters')
    .aggregate(
      [
        {
          $match: { favorited: userId }
        },
        {
          $group: {
            _id: '$manga_id',
            title: {
              $first: '$manga_title'
            }
          }
        },
        {
          $skip: offset
        },
        {
          $limit: 10
        }
      ]
    )

  const keyboard = chapters
    .map(chapter =>
      ([{
        text: `${chapter.manga_title}`,
        callback_data: `list=fav-${offset}:manga=${chapter.manga_id}:p=1:o=0`
      }])
    )
  const navigation = []

  if (chapters.length === 10 && chapters.slice(offset + 10, offset + 20).length >= 1) {
    navigation.push(
      {
        text: buttons.next,
        callback_data: `list=fav-${offset + 10}`
      }
    )
  }
  navigation.unshift(
    {
      text: buttons.page.refresh(),
      callback_data: `list=fav-${offset}`
    }
  )
  if (offset - 10 === 0 || offset - 10 > 0) {
    navigation.unshift(
      {
        text: buttons.back,
        callback_data: `list=fav-${offset - 10}`
      }
    )
  }
  return {
    text: templates.manga.favoriteListView(chapters.length, offset),
    extra: {
      reply_markup: {
        inline_keyboard: [
          navigation
        ].concat(keyboard)
      },
      parse_mode: 'HTML'
    }
  }
}
