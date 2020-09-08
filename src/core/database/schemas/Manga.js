import mongoose from 'mongoose'
const { Schema } = mongoose

export const Manga = new Schema({
  id: {
    type: Number,
    unique: true
  },
  cover_url: {
    type: String,
    required: true
  },
  last_chapter: {
    type: String,
    required: false
  },
  lang_name: {
    type: String,
    required: false
  },
  lang_flag: {
    type: String,
    required: false
  },
  status: {
    type: Number,
    required: false
  },
  genres: [
    Number
  ],
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  links: {
    type: Object,
    required: false
  },
  reading: {
    type: [Number],
    required: false,
    default: []
  },
  favorited: {
    type: [Number],
    required: false,
    default: []
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})
