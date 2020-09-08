import mongoose from 'mongoose'
const { Schema } = mongoose

export const Chapter = new Schema({
  id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: false
  },
  lang: {
    type: String,
    required: false
  },
  chapter: {
    type: String,
    required: false
  },
  volume: {
    type: String,
    required: false
  },
  telegraph: {
    type: String,
    required: false
  },
  manga_id: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    required: false
  },
  external: {
    type: String,
    required: false
  },
  timestamp: {
    type: Number,
    required: false
  },
  read: {
    type: [Number],
    required: false
  }
}, {
  timestamps: {
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  }
})
