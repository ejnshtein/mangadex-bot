import collection from '../../core/database/index.js'
import MangadexApi from 'mangadex-api'
import { buttons, templates } from '../../lib/index.js'
const { getLangName } = MangadexApi

export default async function readingListView ({
  fromId,
  offset = 0
}) {
  const result = await collection('chapters').aggregate(
    [
      { $match: { read: fromId } },
      {
        $facet: {
          count_result: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 }
              }
            }
          ],
          chapters: [
            { $skip: offset },
            { $limit: 10 },
            {
              $project: {
                read: 0
              }
            }
          ]
        }
      }
    ]
  )
  if (result.length) {
    const { chapters, count_result } = result.pop()
    const { count } = count_result.pop()
    const keyboard = chapters.map(chapter =>
      [
        {
          text: `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}${chapter.chapter ? `Ch. ${chapter.chapter} ` : ''}${chapter.lang ? ` (${getLangName(chapter.lang)})` : ''} ${chapter.manga_title}`,
          callback_data: `manga:id=${chapter.manga_id}`
        }
      ]
    )
    const navigation = []

    if (chapters.length === 10 && count - offset + 10 >= 1) {
      navigation.push(
        {
          text: buttons.next,
          callback_data: `readlist:${offset + 10}`
        }
      )
    }
    navigation.unshift(
      {
        text: buttons.page.refresh(),
        callback_data: `readlist:${offset}`
      }
    )
    if (offset - 10 === 0 || offset - 10 > 0) {
      navigation.unshift(
        {
          text: buttons.back,
          callback_data: `readlist:${offset - 10}`
        }
      )
    }
    return {
      text: templates.manga.readingListView(count, offset),
      extra: {
        reply_markup: {
          inline_keyboard: [navigation].concat(keyboard)
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
