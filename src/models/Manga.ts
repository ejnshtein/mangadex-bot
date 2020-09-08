import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose'
import { connection } from '../database'

type MangaRating = {
  bayesian: string
  mean: string
  users: string
}

type MangaRelated = {
  manga_hentai: number
  manga_name: string
  related_manga_id: number
  relation_id: number
}

export interface MangaData {
  /**
   * Manga title
   */
  title: string

  /**
   * Alternative names
   */
  alt_names: string[]

  /**
   * Manga artist
   */
  artist: string

  /**
   * Manga author
   */
  author: string

  /**
   * Relative path to cover
   */
  cover_url: string

  /**
   * Relative paths to manga volumes covers
   */
  covers: string[]

  /**
   * Manga description
   */
  description: string

  /**
   * Manga genres as numbers
   */
  genres: number[]

  /**
   * Hentai manga boolean (0 or 1)
   */
  hentai: number

  /**
   * Manga language flag
   */
  lang_flag: string

  /**
   * Manga language name
   */
  lang_name: string

  /**
   * Manga last chapter number (0 if manga is not finished)
   */
  last_chapter: string

  /**
   * Last updated unix timestamp
   */
  last_updated: number

  /**
   * Last volume (null if manga not finished)
   */
  last_volume: number

  /**
   * Manga links (amazon, mal, raw, e.t.c)
   */
  links: Map<string, string>

  /**
   * Manga rating
   */
  rating: MangaRating

  /**
   * Related manga
   */
  related: MangaRelated[]

  /**
   * Manga status: "1" - ongoing, "2" - completed
   */
  status: number

  /**
   * Manga views
   */
  views: number
}

@modelOptions({
  existingConnection: connection,
  schemaOptions: {
    timestamps: {
      updatedAt: 'updated_at',
      createdAt: 'created_at'
    },
    toJSON: {
      virtuals: true
    }
  }
})
export class Manga {
  @prop({ unique: true })
  public manga_id: number

  public manga: MangaData

  public updated_at: number
  public created_at: number
}

export const MangaModel = getModelForClass(Manga)

export const MangaKeys = [
  'title',
  'alt_names',
  'artist',
  'author',
  'cover_url',
  'covers',
  'description',
  'genres',
  'hentai',
  'lang_flag',
  'lang_name',
  'last_chapter',
  'last_updated',
  'last_volume',
  'links',
  'rating',
  'related',
  'status',
  'views'
]
