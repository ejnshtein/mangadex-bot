import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose'
import { connection } from '../database'

export interface ChapterData {
  /**
   * Chapter id
   */
  id: number

  /**
   * Chapter title
   */
  title: string

  /**
   * Chapter number
   */
  chapter: string

  /**
   * Chapter volume
   */
  volume: string

  /**
   * Manga id
   */
  manga_id: number

  /**
   * Comments count
   */
  comments: number

  /**
   * One of these:
   * `unavailable` - means chapter was deleted
   * `external` - means chapter is not hosted on mangadex
   * `OK` - ok
   */
  status: string

  /**
   * Chapter language code (gb, jp, ru, e.t.c.)
   */
  lang_code: string

  /**
   * Chapter language full name
   */
  lang_name: string

  /**
   * When chapter was published timestamp in unix
   */
  timestamp: number

  long_strip: number

  /**
   * Hash for server images
   */
  hash: string

  /**
   * Chapter pages list
   */
  page_array: string[]

  /**
   * Chapter server url
   */
  server: string

  /**
   * Shows only if manga is now hosted on mangadex (Like Dr. Stone)
   * Will contain url to chapter.
   */
  external: string

  group_id: number

  group_name: string

  group_id_2?: number

  group_name_2?: string

  group_id_3?: number

  group_name_3?: string
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
export class Chapter {
  @prop({ unique: true })
  public chapter_id: number

  public chapter: ChapterData

  public updated_at: number
  public created_at: number
}

export const ChapterModel = getModelForClass(Chapter)

export const ChapterKeys = [
  'id',
  'title',
  'chapter',
  'volume',
  'manga_id',
  'comments',
  'status',
  'lang_code',
  'lang_name',
  'timestamp',
  'long_strip',
  'hash',
  'page_array',
  'server',
  'external',
  'group_id',
  'group_name',
  'group_id_2',
  'group_name_2',
  'group_id_3',
  'group_name_3'
]
