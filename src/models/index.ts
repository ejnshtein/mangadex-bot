import { connection } from '@src/database'

export const ModelOptions = {
  existingConnection: connection,
  schemaOptions: {
    timestamps: {
      updatedAt: 'updated_at',
      createdAt: 'created_at'
    },
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
}
