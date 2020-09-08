export default (mangaId, chapterId, user) => {
  chapterId = typeof chapterId !== 'number' ? Number.parseInt(chapterId) : chapterId
  mangaId = typeof mangaId !== 'number' ? Number.parseInt(mangaId) : mangaId
  if (user.currently_reading) {
    if (user.currently_reading.some(el => el.manga_id === mangaId)) {
      const chapter = user.currently_reading.find(el => el.manga_id === mangaId)
      if (chapter.chapter_id !== chapterId) {
        chapter.chapter_id = chapterId
      } else {
        chapter.updated_at = Date.now()
      }
    } else {
      user.currently_reading.push({
        manga_id: mangaId,
        chapter_id: chapterId
      })
    }
  } else {
    user.currently_reading = [{
      manga_id: mangaId,
      chapter_id: chapterId
    }]
  }
  user.markModified('currently_reading')
  return user.save()
}
