import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose'
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
export class User {
  @prop({ unique: true })
  public id: number

  @prop({ required: false })
  public username: string

  @prop({ required: true })
  public first_name: string

  @prop({ required: false })
  public last_name: string

  @prop({ required: true, default: false })
  public private_mode: boolean

  @prop({ required: true, default: true })
  public inline_buttons: boolean
}

export const UserModel = getModelForClass(User)
