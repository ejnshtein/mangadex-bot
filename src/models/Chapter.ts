import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose'
import {
  Chapter as MDChapter,
  MangaChapter
} from 'mangadex-api/typings/mangadex'
import { connection } from '../database'

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

  @prop({ default: 'preview' })
  public type?: string

  @prop({ required: true })
  public chapter: MDChapter | MangaChapter

  @prop({ default: false })
  public cached?: boolean

  @prop({ default: '' })
  public telegraph_url?: string

  public updated_at?: number
  public created_at?: number
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
