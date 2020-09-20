import LRUCache from 'lru-cache'
import { Chapter, Manga } from 'mangadex-api/typings/mangadex'
const LRU = require('lru-cache')

export const mangaCache = new LRU({
  maxAge: 1000 * 60 * 5
}) as LRUCache<number, Manga>

export const chapterCache = new LRU({
  maxAge: 1000 * 60 * 10
}) as LRUCache<number, Chapter>
