import { ViewResult } from '@type/view'
import { getManga } from '@mangadex/client'
import { User } from '@src/models/User'

type MangaViewArgument = {
  mangaId: number
  list: string
  favorite: boolean
  history: string
  user: User
}

export const mangaView = async (
  arg: MangaViewArgument
): Promise<ViewResult> => {
  const { mangaId, list, favorite, history } = arg

  const result: ViewResult = {}

  const { manga } = await getManga(mangaId)

  return result
}
