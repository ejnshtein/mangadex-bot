import collection from '../core/database/index.js'
import MangadexApi from 'mangadex-api'
import { buttons, templates } from '../lib/index.js'
const { getLangName } = MangadexApi

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
            localField: 'currently_reading.chapter_id',
            foreignField: 'id',
            as: 'currently_reading'
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
    const slicedChapters = user.currently_reading
      .slice(offset, offset + 10)
    const keyboard = slicedChapters
      ? slicedChapters
        .map(chapter =>
          ([{
            text: `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}${chapter.chapter ? `Ch. ${chapter.chapter} ` : ''}${chapter.lang ? ` (${getLangName(chapter.lang)})` : ''} ${chapter.manga_title}`,
            callback_data: `list=read-${offset}:manga=${chapter.manga_id}:p=1:o=0`
          }])
        )
      : []
    const navigation = []

    if (slicedChapters.length === 10 && user.currently_reading.slice(offset + 10, offset + 20).length >= 1) {
      navigation.push(
        {
          text: buttons.next,
          callback_data: `list=read-${offset + 10}`
        }
      )
    }
    navigation.unshift(
      {
        text: buttons.page.refresh(),
        callback_data: `list=read-${offset}`
      }
    )
    if (offset - 10 === 0 || offset - 10 > 0) {
      navigation.unshift(
        {
          text: buttons.back,
          callback_data: `list=read-${offset - 10}`
        }
      )
    }
    return {
      text: templates.manga.readingListView(user.currently_reading.length, offset),
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
