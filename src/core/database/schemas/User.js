import mongoose from 'mongoose'
const { Schema } = mongoose

export const User = new Schema({
  id: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: false
  },
  first_name: {
    type: String,
    required: false
  },
  last_name: {
    type: String,
    required: false
  },
  is_admin: {
    type: Boolean,
    required: false,
    default: false
  },
  mangadex_session: {
    type: String,
    required: false
  },
  mangadex_remember_token: {
    type: String,
    required: false
  }
}, {
  timestamps: {
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  }
})
