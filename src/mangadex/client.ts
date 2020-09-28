import { MangaModel, MangaKeys, DBMangaData } from '@src/models/Manga'
import { client } from '@mangadex/index'
import {
  saveNewChapters,
  saveNewGenres,
  saveNewGroups,
  saveNewManga
} from '@mangadex/save'
import { hasDifference } from '@lib/difference'
import { diff } from '@lib/diff'
import { cleanObject } from '@lib/clean-object'
import { ChapterModel, ChapterKeys } from '@src/models/Chapter'
import { mangaCache, chapterCache } from './cache'
import {
  Chapter,
  Manga,
  MangaData,
  MangaGroup
} from 'mangadex-api/typings/mangadex'
import { GroupModel } from '@src/models/Group'
import { GenreModel } from '@src/models/Genre'

export interface GetMangaOptions {
  select?: Array<string>
}

export const getManga = async (
  mangaId: number,
  options: GetMangaOptions = {}
): Promise<Manga> => {
  const cachedManga = mangaCache.get(mangaId)

  if (cachedManga) {
    return cachedManga
  }

  const dbManga = await MangaModel.findOne({ manga_id: mangaId })

  if (dbManga) {
    // If cache is outdated then update it
    if (dbManga.updated_at - 1000 * 5 * 60 > Date.now()) {
      const apiManga = await client.getManga(mangaId)

      const [groupsCount, chaptersCount] = await Promise.all([
        GroupModel.countDocuments({
          manga: mangaId
        }),
        ChapterModel.countDocuments({
          'chapter.manga_id': mangaId
        })
      ])

      mangaCache.set(mangaId, apiManga)

      if (
        hasDifference(cleanObject(dbManga.manga, MangaKeys), apiManga.manga)
      ) {
        await saveNewGenres(apiManga.manga.genres)
        const saveManga = {
          ...apiManga.manga,
          genres: apiManga.manga.genres.map(({ id }) => id)
        } as DBMangaData
        await MangaModel.updateOne(
          { manga_id: mangaId },
          {
            $set: {
              manga: saveManga
            }
          }
        )
      }
      if (
        apiManga.chapter.length !== chaptersCount &&
        apiManga.chapter.length > chaptersCount
      ) {
        await saveNewChapters(mangaId, apiManga.chapter)
      }
      if (
        apiManga.group.length !== groupsCount &&
        apiManga.group.length > groupsCount
      ) {
        await saveNewGroups(mangaId, apiManga.group)
      }

      return apiManga
    }

    // else check if only manga field is needed
    if (
      options.select &&
      options.select.includes('manga') &&
      options.select.length === 1
    ) {
      return { manga: (dbManga.manga as unknown) as MangaData } as Manga
    }
    // else gather all fields
    const [chapters, groups, genres] = await Promise.all([
      ChapterModel.find({
        'chapter.manga_id': mangaId
      }).sort({ chapter_id: 'asc' }),
      GroupModel.find({
        manga: mangaId
      }),
      GenreModel.find({
        id: {
          $in: dbManga.manga.genres
        }
      })
    ])

    return {
      group: groups.map(({ group }) => group as MangaGroup),
      chapter: chapters.map(({ chapter }) => chapter as Chapter),
      manga: {
        ...dbManga.manga,
        genres: genres.map(({ genre_id, name }) => ({ id: genre_id, name }))
      } as MangaData,
      status: 'OK'
    } as Manga
  }

  const apiManga = await client.getManga(mangaId)

  await saveNewChapters(mangaId, apiManga.chapter)
  await saveNewGroups(mangaId, apiManga.group)
  await saveNewManga(mangaId, apiManga.manga)

  return apiManga
}

export const getChapter = async (chapterId: number): Promise<Chapter> => {
  const cachedChapter = chapterCache.get(chapterId)

  if (cachedChapter) {
    return cachedChapter
  }

  const dbChapter = await ChapterModel.findOne({ chapter_id: chapterId })

  if (!dbChapter) {
    const apiChapter = await client.getChapter(chapterId)

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
    const apiChapter = await client.getChapter(chapterId)
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
        { $set: { chapter: changes as Chapter } }
      )
      return apiChapter
    }
  }
  chapterCache.set(chapterId, dbChapter.chapter as Chapter)

  return dbChapter.chapter as Chapter
}
