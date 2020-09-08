import { MangaModel, MangaKeys, MangaData } from '@src/models/Manga'
import { client } from '@mangadex/index'
import { formatManga } from '@src/lib/format-data'
import { hasDifference } from '@lib/difference'
import { diff } from '@lib/diff'
import { cleanObject } from '@lib/clean-object'
import { ChapterData, ChapterModel, ChapterKeys } from '@src/models/Chapter'
import { mangaCache, chapterCache } from './cache'

export interface MangaResult {
  type: 'cache' | 'db' | 'api'
  manga: MangaData
}

export interface ChapterResult {
  type: 'cache' | 'db' | 'api'
  chapter: ChapterData
}

export const getManga = async (mangaId: number): Promise<MangaResult> => {
  const result: MangaResult = {
    type: null,
    manga: null
  }
  const cachedManga = mangaCache.get(mangaId) as MangaData

  if (cachedManga) {
    result.manga = cachedManga
    result.type = 'cache'
    return result
  }
  const dbManga = await MangaModel.findOne({ manga_id: mangaId })

  if (!dbManga) {
    const apiManga = await client.getManga(mangaId)

    const formattedManga = formatManga(apiManga)

    mangaCache.set(mangaId, formattedManga)

    const manga = new MangaModel({
      manga_id: mangaId,
      manga: formattedManga
    })

    await manga.save()

    result.type = 'api'
    result.manga = formattedManga

    return result
  }
  // If cache is outdated then update it
  if (dbManga.updated_at - 1000 * 5 * 60 > Date.now()) {
    const apiManga = await client.getManga(mangaId)
    const formattedManga = formatManga(apiManga)
    if (hasDifference(cleanObject(dbManga.manga, MangaKeys), formattedManga)) {
      const changes = diff(
        cleanObject(dbManga.manga, MangaKeys),
        formattedManga
      )
      mangaCache.set(mangaId, formattedManga)
      await MangaModel.updateOne(
        { manga_id: mangaId },
        { $set: { manga: changes as MangaData } }
      )

      result.type = 'api'
      result.manga = formattedManga

      return result
    }
  }
  mangaCache.set(mangaId, dbManga.manga)

  result.type = 'db'
  result.manga = dbManga.manga

  return result
}

export const getChapter = async (chapterId: number): Promise<ChapterData> => {
  const cachedChapter = chapterCache.get(chapterId) as ChapterData

  if (cachedChapter) {
    return cachedChapter
  }

  const dbChapter = await ChapterModel.findOne({ chapter_id: chapterId })

  if (!dbChapter) {
    const apiChapter = (await client.getChapter(chapterId)) as ChapterData

    chapterCache.set(chapterId, apiChapter)

    const chapter = new ChapterModel({
      chapter_id: chapterId,
      chapter: apiChapter
    })

    await chapter.save()

    return apiChapter
  }
  // If cache is outdated then update it
  if (dbChapter.updated_at - 1000 * 5 * 60 > Date.now()) {
    const apiChapter = (await client.getChapter(chapterId)) as ChapterData
    if (
      hasDifference(cleanObject(dbChapter.chapter, ChapterKeys), apiChapter)
    ) {
      const changes = diff(
        cleanObject(dbChapter.chapter, ChapterKeys),
        apiChapter
      )
      chapterCache.set(chapterId, apiChapter)
      await ChapterModel.updateOne(
        { chapter_id: chapterId },
        { $set: { chapter: changes as ChapterData } }
      )
      return apiChapter
    }
  }
  chapterCache.set(chapterId, dbChapter.chapter)

  return dbChapter.chapter
}
