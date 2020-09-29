import { ViewResult } from '@type/view'
import { getManga } from '@mangadex/client'
import { User } from '@src/models/User'
import { I18n } from '@type/telegraf-i18n'
import { Composer } from 'mangadex-api'
import { ChapterModel } from '@src/models/Chapter'
import { mangaTemplate } from '@src/template/manga'
import { InlineKeyboardButton } from 'telegraf/typings/telegram-types'
import { buildCallbackData } from '@lib/inline-args'
import * as button from '@lib/button'

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

  /**
   * mangaId, list, language, history
   */
  const languageSelectedMangaCallbackDataArguments = {
    m: mangaId,
    l: list,
    la: lang,
    h: history
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

  const [chapters, chaptersCount] = await Promise.all([
    ChapterModel.find({
      'chapter.manga_id': mangaId,
      'chapter.lang_code': lang
    })
      .sort('chapter_id')
      .skip(offset + 10)
      .limit(10),
    ChapterModel.find({
      'chapter.manga_id': mangaId,
      'chapter.lang_code': lang
    }).countDocuments()
  ])

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
      callback_data: buildCallbackData('chapter', {
        l: list,
        c: languageChapter.chapter_id
      })
    }

    if (keyboard[keyboard.length - 1].length < 2) {
      keyboard[keyboard.length - 1].push(button)
    } else {
      keyboard.push([button])
    }
  }

  keyboard.unshift([
    {
      text: `${button.back()} ${i18n.t('button.back')}`,
      callback_data: buildCallbackData('manga', {
        l: list,
        h: history,
        m: mangaId
      })
    }
  ])

  const chaptersNavigationLayer: InlineKeyboardButton[] = []

  chaptersNavigationLayer.push({
    text: button.page.locate(offset / 10),
    callback_data: buildCallbackData('lang', {
      ...languageSelectedMangaCallbackDataArguments,
      o: offset
    })
  })

  const chaptersToRight = chaptersCount - (offset + 10)
  const chaptersToLeft = chaptersCount - chaptersToRight - 10

  if (chapters.length === 10) {
    if (chaptersToRight - 10 >= 1) {
      chaptersNavigationLayer.push({
        text: button.page.next((offset + 10) / 10 + 1),
        callback_data: buildCallbackData('lang', {
          ...languageSelectedMangaCallbackDataArguments,
          o: offset + 10
        })
      })
    }

    if (chaptersToRight - 20 >= 1) {
      chaptersNavigationLayer.push({
        text: button.page.nextDub((offset + 20) / 10 + 1),
        callback_data: buildCallbackData('lang', {
          ...languageSelectedMangaCallbackDataArguments,
          o: offset + 20
        })
      })
    }
  }

  if (chaptersToLeft >= 1) {
    chaptersNavigationLayer.unshift({
      text: button.page.prev(offset / 10 + 1),
      callback_data: buildCallbackData('lang', {
        ...languageSelectedMangaCallbackDataArguments,
        o: offset - 10 > 0 ? offset - 10 : 0
      })
    })
  }
  if (chaptersToLeft - 10 >= 1) {
    chaptersNavigationLayer.unshift({
      text: button.page.prevDub((offset - 10) / 10 + 1),
      callback_data: buildCallbackData('lang', {
        ...languageSelectedMangaCallbackDataArguments,
        o: offset - 20 > 0 ? offset - 20 : 0
      })
    })
  }

  keyboard.push(chaptersNavigationLayer)

  result.extra.reply_markup = {
    inline_keyboard: keyboard
  }

  return result
}
