import { ViewResult } from '@type/view'
import { getManga } from '@mangadex/client'
import { User } from '@src/models/User'
import { I18n } from '@type/telegraf-i18n'
import { Composer } from 'mangadex-api'
import { ChapterModel } from '@src/models/Chapter'
import { mangaTemplate } from '@src/template/manga'
import { InlineKeyboardButton } from 'telegraf/typings/telegram-types'
import { stringifyInlineArguments } from '@lib/inline-args'
import buttons from '@lib/buttons'

const Composer = require('mangadex-api/src/Composer') as Composer

type LanguageSelectedMangaViewArgument = {
  mangaId: number
  lang: string
  user: User
  history: string
  list: string
  i18n: I18n
  offset: number
}

export const languageSelectedManga = async ({
  mangaId,
  lang,
  user,
  history,
  list,
  offset = 0,
  i18n
}: LanguageSelectedMangaViewArgument): Promise<ViewResult> => {
  const result: ViewResult = {
    text: '',
    extra: {
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }
  }

  const { manga, chapter } = await getManga(mangaId, {
    select: ['manga', 'chapter']
  })

  result.text = mangaTemplate({
    chaptersCount: chapter.length,
    i18n,
    list,
    manga,
    mangaId
  })

  const chapters = await ChapterModel.find({
    'chapter.manga_id': mangaId,
    'chapter.lang_code': lang
  })
    .skip(offset + 10)
    .limit(10)
    .sort('chapter_id')

  const keyboard: InlineKeyboardButton[][] = [[]]

  for (const languageChapter of chapters) {
    let buttonText = ''

    buttonText += `${languageChapter.type === 'preview' ? '⬇  ' : ''}`
    buttonText += `${
      languageChapter.chapter.chapter
        ? `${
            languageChapter.chapter.volume
              ? `Vol. ${languageChapter.chapter.volume} `
              : ''
          }Ch. ${languageChapter.chapter.chapter}`
        : languageChapter.chapter.title
    }`

    const button: InlineKeyboardButton = {
      text: buttonText,
      callback_data: `chapter:${stringifyInlineArguments({
        list,
        chapter: languageChapter.chapter_id
      })}`
    }

    if (keyboard[keyboard.length - 1].length < 2) {
      keyboard[keyboard.length - 1].push(button)
    } else {
      keyboard.push([button])
    }
  }

  keyboard.unshift([
    {
      text: buttons.back,
      callback_data: `manga:${stringifyInlineArguments({
        list,
        history,
        mangaId
      })}`
    }
  ])

  result.extra.reply_markup = {
    inline_keyboard: keyboard
  }

  return result
}
