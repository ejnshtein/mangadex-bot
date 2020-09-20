import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose'
import { MangaData } from 'mangadex-api/typings/mangadex'
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
export class Manga {
  @prop({ unique: true })
  public manga_id: number

  @prop({ required: true })
  public manga: MangaData

  @prop({ required: true })
  public groups: number[]

  public updated_at?: number
  public created_at?: number
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
