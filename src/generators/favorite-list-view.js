import collection from '../core/database/index.js'
import { buttons, templates } from '../lib/index.js'

export default async (userId, offset = 0) => {
  try {
    var user = await collection('users').aggregate(
      [
        {
          $match: {
            id: userId
          }
        },
        {
          $lookup: {
            from: 'chapters',
            localField: 'favorite_titles.manga_id',
            foreignField: 'manga_id',
            as: 'favorite_titles'
          }
        }
      ]
    ).exec().then(users => users[0])
  } catch (e) {
    return {
      text: templates.error(e),
      extra: {
        parse_mode: 'HTML'
      }
    }
  }
  if (user) {
    const chapters = user.favorite_titles
      .reduce((acc, v) => {
        if (!acc.some(x => v.manga_id === x.manga_id)) acc.push(v)
        return acc
      }, [])

    const slicedChapters = chapters
      .slice(offset, offset + 10)

    const keyboard = slicedChapters
      ? slicedChapters
        .map(chapter =>
          ([{
            text: `${chapter.manga_title}`,
            callback_data: `list=fav-${offset}:manga=${chapter.manga_id}:p=1:o=0`
          }])
        )
      : []
    const navigation = []

    if (slicedChapters.length === 10 && chapters.slice(offset + 10, offset + 20).length >= 1) {
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
  } else {
    return {
      text: 'Oops, something went wrong...',
      extra: {
        parse_mode: 'HTML'
      }
    }
  }
}
