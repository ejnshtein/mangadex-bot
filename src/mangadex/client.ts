import { MangaModel, MangaKeys } from '@src/models/Manga'
import { client } from '@mangadex/index'
import { hasDifference } from '@lib/difference'
import { diff } from '@lib/diff'
import { cleanObject } from '@lib/clean-object'
import { ChapterModel, ChapterKeys } from '@src/models/Chapter'
import { mangaCache, chapterCache } from './cache'
import { Chapter, Manga, MangaGroup } from 'mangadex-api/typings/mangadex'
import { GroupModel } from '@src/models/Group'

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
      if (
        hasDifference(cleanObject(dbManga.manga, MangaKeys), apiManga.manga) ||
        dbManga.groups.length !== apiManga.group.length
      ) {
        mangaCache.set(mangaId, apiManga)
        await MangaModel.updateOne(
          { manga_id: mangaId },
          {
            $set: {
              manga: apiManga.manga,
              groups: apiManga.group.map(({ id }) => id)
            }
          }
        )

        return apiManga
      }

      await MangaModel.updateOne(
        { manga_id: mangaId },
        { $set: { updated_at: Date.now() } }
      )

      return apiManga
    }

    // else check if only manga field is needed
    if (
      options.select &&
      options.select.includes('manga') &&
      options.select.length === 1
    ) {
      return { manga: dbManga.manga } as Manga
    }
    // else gather all fields
    const chapter = await ChapterModel.find({
      'cached.manga_id': mangaId
    }).sort({ chapter_id: 'asc' })

    const group = await GroupModel.find({
      group_id: {
        $in: dbManga.groups
      }
    })

    return {
      group: group.map(({ group }) => group as MangaGroup),
      chapter: chapter.map(({ chapter }) => chapter as Chapter),
      manga: dbManga.manga,
      status: 'OK'
    } as Manga
  }

  const apiManga = await client.getManga(mangaId)

  const existsChapters = await ChapterModel.find(
    {
      'chapter.manga_id': mangaId
    },
    'chapter_id'
  )

  const chaptersToCreate = apiManga.chapter.filter(
    ({ id }) => !existsChapters.some(({ chapter_id }) => chapter_id === id)
  )

  for (const chapter of chaptersToCreate) {
    await ChapterModel.create({
      chapter_id: chapter.id,
      chapter: chapter
    })
  }

  const existsGroups = await GroupModel.find(
    {
      group_id: {
        $in: apiManga.group.map(({ id }) => id)
      }
    },
    'group_id'
  )

  const groupsToCreate = apiManga.group.filter(
    ({ id }) => !existsGroups.some(({ group_id }) => group_id === id)
  )

  for (const group of groupsToCreate) {
    console.log(group)
    await GroupModel.create({
      group_id: parseInt(group.id),
      group
    })
  }

  await MangaModel.create({
    manga_id: mangaId,
    manga: apiManga.manga,
    groups: apiManga.group.map(({ id }) => id)
  })

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
