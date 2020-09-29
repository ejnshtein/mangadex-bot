import { ViewResult } from '@type/view'
import { getManga } from '@mangadex/client'
import { User } from '@src/models/User'
import { I18n } from '@type/telegraf-i18n'
import { InlineKeyboardButton } from 'telegraf/typings/telegram-types'
import { groupBy } from '@lib/group-by'
import { buildCallbackData } from '@lib/inline-args'
import { MangaChapter } from 'mangadex-api/typings/mangadex'
import { getLangEmoji } from '@lib/get-lang-emoji'
import { Composer } from 'mangadex-api'
import { ChapterModel } from '@src/models/Chapter'
import { mangaTemplate } from '@template/manga'
import * as button from '@lib/button'
const Composer = require('mangadex-api/src/Composer') as Composer

type MangaViewArgument = {
  mangaId: number
  list: string
  favorite: boolean
  history: string
  user: User
  i18n: I18n
}

export const mangaView = async ({
  mangaId,
  list,
  favorite,
  history,
  i18n
}: MangaViewArgument): Promise<ViewResult> => {
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

  const keyboard: InlineKeyboardButton[][] = [[]]

  if (chapter.length > 0) {
    const cachedChapters = await ChapterModel.find(
      {
        'chapter.manga_id': mangaId,
        type: 'full'
      },
      'chapter_id'
    )

    const chapters = groupBy<MangaChapter, string>(
      chapter,
      (item) => item.lang_code
    )
    for (const code of Object.keys(chapters)) {
      let text = ''
      const emoji = getLangEmoji(code)
      if (emoji) {
        text += emoji
      }
      text += `${Composer.getLangName(code)} `
      const cachedChaptersLength = chapters[code].filter(({ id }) =>
        cachedChapters.some(({ chapter_id }) => chapter_id === id)
      ).length
      const totalChaptersLength = chapters[code].length

      text += `(${cachedChaptersLength}/${totalChaptersLength})`
      const languageButton: InlineKeyboardButton = {
        text,
        callback_data: buildCallbackData('lang', {
          m: mangaId,
          la: code,
          l: list,
          h: history
        })
      }
      if (keyboard[keyboard.length - 1].length < 2) {
        keyboard[keyboard.length - 1].push(languageButton)
      } else {
        keyboard.push([languageButton])
      }
    }
    keyboard.unshift([
      {
        text: i18n.t('manga.choose_language_button'),
        callback_data: 'choose_lang_button'
      }
    ])
  }

  keyboard.unshift([
    {
      text: `${button.back()} ${i18n.t('button.back')}`,
      callback_data: 'back'
    },
    {
      text: `${button.refresh()} ${i18n.t('button.refresh')}`,
      callback_data: buildCallbackData('manga', { m: mangaId })
    }
  ])

  // keyboard.unshift([
  //   {
  //     text: mangaInDb.is_favorited
  //       ? buttons.favorite(false)
  //       : buttons.favorite(),
  //     callback_data: `favorite:${mangaId}`
  //   },
  //   {
  //     text: buttons.share,
  //     switch_inline_query: `manga:${mangaId}`
  //   },
  //   {
  //     text: 'Public link',
  //     callback_data: `sharemanga:${mangaId}`
  //   }
  // ])

  result.extra.reply_markup = {
    inline_keyboard: keyboard
  }

  return result
}
