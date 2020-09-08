import LRU from 'lru-cache'

export const mangaCache = new LRU({
  maxAge: 1000 * 60 * 5
})

export const chapterCache = new LRU({
  maxAge: 1000 * 60 * 10
})
