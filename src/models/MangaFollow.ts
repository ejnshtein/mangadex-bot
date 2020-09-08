import { modelOptions, getModelForClass } from '@typegoose/typegoose'
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
export class MangaFollow {
  public user_id: number

  public manga_id: number

  public status: string
}

export const MangaFollowModel = getModelForClass(MangaFollow)
