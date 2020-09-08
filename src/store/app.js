import { createEvent, createStore, createEffect } from 'effector-esm'
import { bot } from '../core/bot.js'

export const addUserMessage = createEffect('add user id', {
  handler: async ({ userId, messageText, messageOptions }) => {
    const message = await bot.telegram.sendMessage(
      userId,
      messageText || 'This message will be used for display caching progress.',
      messageOptions || {}
    )
    return message
  }
})

export const addUser = createEvent('add user to queue')
export const removeUser = createEvent('remove user from queue')
export const addChapters = createEvent('add chapters')
export const removeChapter = createEvent('remove chapter')

export const store = createStore({
  users: new Map(),
  chapters: new Map()
})
  .on(addUser, (state, user) => {
    state = { ...state }
    addChapters(user.chapters)
    if (state.users.has(user.id)) {
      const stateUser = state.users.get(user.id)
      user.chapters.forEach(({ id }) => {
        if (!stateUser.chapters.has(id)) {
          stateUser.chapters.add(id)
        }
      })
    } else {
      state.users.set(user.id, {
        ...user,
        chapters: new Set(user.chapters.map(({ id }) => id))
      })
    }
    return state
  })
  .on(removeUser, (state, userId) => {
    state = { ...state }
    state.users.delete(userId)
    return state
  })
  .on(removeChapter, (state, chapterId) => {
    state = { ...state }
    state.users.forEach((userId, user) => {
      if (user.chapters.has(chapterId)) {
        user.chapters.delete(chapterId)
      }
      if (user.chapters.size === 0) {
        state.users.delete(userId)
      }
    })
    state.chapters.delete(chapterId)
    return state
  })
  .on(addUserMessage.done, (state, { params, result }) => {
    state = { ...state }
    const user = state.users.get(params.userId)
    user.message_id = result.message_id
    return state
  })
  .on(addUserMessage.fail, (state, { params, result }) => {
    state = { ...state }
    const user = state.users.get(params.userId)
    user.message_id = null
    return state
  })
  .on(addChapters, (state, chapters) => {
    state = { ...state }
    if (!Array.isArray(chapters)) {
      chapters = [chapters]
    }
    chapters.forEach(chapter => {
      if (!state.chapters.has(chapter.id)) {
        state.chapters.set(chapter.id, chapter)
      }
    })
    return state
  })
