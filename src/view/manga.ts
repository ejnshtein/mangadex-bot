import { ViewResult } from '@type/view'
import { getManga } from '@mangadex/client'
import { User } from '@src/models/User'
import { I18n } from '@type/telegraf-i18n'
import { templates } from '@lib/templates'
const HtmlEntities = require('html-entities')

const { AllHtmlEntities } = HtmlEntities
const { decode } = new AllHtmlEntities()

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
    extra: {
      parse_mode: 'HTML'
    }
  }

  const { manga, chapter } = await getManga(mangaId, {
    select: ['manga', 'chapter']
  })

  // decode title characters
  manga.title = decode(manga.title)

  const view = i18n.t('manga.view', {
    mangaId,
    manga,
    chapter,
    genres: manga.genres
      .map(
        (genre) =>
          `<a href="https://mangadex.org/genre/${genre.id}">${genre.name}</a>`
      )
      .join(', ')
  })

  result.text += view

  if (chapter.length === 0) {
    result.text += `\n\n${i18n.t('manga.without_chapters')}`
  }

  if (manga.hentai === 1) {
    result.text += `\n${i18n.t('manga.hentai_manga')}`
  }

  if (list) {
    result.text += `\n\n<a href="${i18n.t('list', { list })}">&#8203;</a>`
  }

  result.text += `\n\n${i18n.t('updated_timestamp', {
    timestamp: templates.date()
  })}`

  return result
}
