import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose'
import { MangadexGroup, MangaGroup } from 'mangadex-api/typings/mangadex'
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
export class Group {
  @prop({ unique: true })
  public group_id: number

  @prop({ default: 'preview' })
  public type?: string

  public group: MangadexGroup | MangaGroup

  public updated_at?: number
  public created_at?: number
}

export const GroupModel = getModelForClass(Group)
