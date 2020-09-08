import { Title } from 'mangadex-api/typings/mangadex'
import { MangaData } from '@src/models/Manga'

export const formatManga = (mangaObject: Title): MangaData => {
  const { manga } = mangaObject

  const {
    title,
    alt_names,
    artist,
    author,
    cover_url,
    covers,
    description,
    genres,
    hentai,
    lang_flag,
    lang_name,
    last_chapter,
    last_updated,
    last_volume,
    links,
    rating,
    related,
    status,
    views
  } = (manga as unknown) as MangaData

  return {
    title,
    alt_names,
    artist,
    author,
    cover_url,
    covers,
    description,
    genres,
    hentai,
    lang_flag,
    lang_name,
    last_chapter,
    last_updated,
    last_volume,
    links: links as Map<string, string>,
    rating,
    related,
    status,
    views
  }
}

// export const formatChapter = (chapterObject: ChapterData):  => {

// }
