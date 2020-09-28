import { template } from '@lib/template'
import { I18n } from '@type/telegraf-i18n'
import { MangaData } from 'mangadex-api/typings/mangadex'
const HtmlEntities = require('html-entities')

const { AllHtmlEntities } = HtmlEntities
const { decode } = new AllHtmlEntities()

export type mangaTemplateArguments = {
  mangaId: number
  manga: MangaData
  chaptersCount: number
  i18n: I18n
  list: string
}

export const mangaTemplate = ({
  mangaId,
  manga,
  chaptersCount,
  i18n,
  list
}: mangaTemplateArguments): string => {
  let text = ''

  // decode title characters
  manga.title = decode(manga.title)

  text += `<a href="${manga.cover_url}">&#8203;</a><a href="https://mangadex.org/title/${mangaId}">${manga.title}</a>\n\n`

  text += i18n.t('manga.view', {
    mangaId,
    manga,
    genres: manga.genres
      .map(
        (genre) =>
          `<a href="https://mangadex.org/genre/${genre.id}">${genre.name}</a>`
      )
      .join(', ')
  })

  if (chaptersCount === 0) {
    text += `\n\n${i18n.t('manga.without_chapters')}`
  }

  if (manga.hentai === 1) {
    text += `\n${i18n.t('manga.hentai_manga')}`
  }

  if (list) {
    text += `\n\n<a href="${i18n.t('list', { list })}">&#8203;</a>`
  }

  text += `\n${i18n.t('updated_timestamp', {
    timestamp: template.date()
  })}`

  return text
}
