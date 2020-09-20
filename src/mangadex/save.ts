import { ChapterModel } from '@src/models/Chapter'
import { GenreModel } from '@src/models/Genre'
import { GroupModel } from '@src/models/Group'
import { MangaModel } from '@src/models/Manga'
import {
  Chapter,
  Genre,
  MangaChapter,
  MangaData,
  MangaGroup
} from 'mangadex-api/typings/mangadex'

export const saveNewChapters = async (
  mangaId: number,
  chapters: MangaChapter[]
): Promise<boolean> => {
  const existsChapters = await ChapterModel.find(
    {
      'chapter.manga_id': mangaId
    },
    'chapter_id'
  )

  const chaptersToCreate = chapters.filter(
    ({ id }) => !existsChapters.some(({ chapter_id }) => chapter_id === id)
  )

  for (const chapter of chaptersToCreate) {
    ;(chapter as Chapter).manga_id = mangaId
    await ChapterModel.create({
      chapter_id: chapter.id,
      chapter: chapter as Chapter
    })
  }

  return true
}

export const saveNewGroups = async (
  mangaId: number,
  groups: MangaGroup[]
): Promise<boolean> => {
  const existsGroups = await GroupModel.find(
    {
      group_id: {
        $in: groups.map(({ id }) => id)
      }
    },
    'group_id manga'
  )

  const groupsToCreate = groups.filter(
    ({ id }) => !existsGroups.some(({ group_id }) => group_id === id)
  )

  if (groupsToCreate.length > 0) {
    await GroupModel.create(
      groupsToCreate.map((group) => ({
        group_id: group.id,
        group,
        manga: [mangaId]
      }))
    )
  }

  const groupsToUpdate = existsGroups.filter(
    ({ manga }) => !manga.includes(mangaId)
  )

  if (groupsToUpdate.length > 0) {
    await GroupModel.updateMany(
      {
        group_id: {
          $in: groupsToUpdate.map(({ group_id }) => group_id)
        }
      },
      {
        $addToSet: {
          manga: mangaId
        }
      }
    )
  }

  return true
}

export const saveNewGenres = async (genres: Genre[]): Promise<boolean> => {
  const existsGenres = await GenreModel.find({
    genre_id: {
      $in: genres.map(({ id }) => id)
    }
  })

  const genresToCreate = genres.filter(
    ({ id }) => !existsGenres.some(({ genre_id }) => genre_id === id)
  )

  if (genresToCreate.length > 0) {
    await GenreModel.create(
      genresToCreate.map((genre) => ({
        genre_id: genre.id,
        name: genre.name
      }))
    )
  }

  return true
}

export const saveNewManga = async (
  mangaId: number,
  manga: MangaData
): Promise<boolean> => {
  await MangaModel.create({
    manga_id: mangaId,
    manga: {
      ...manga,
      genres: manga.genres.map(({ id }) => id)
    }
  })

  return true
}
