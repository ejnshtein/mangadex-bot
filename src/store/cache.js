import effector from 'effector'
import collection from '../core/database/index.js'
import MangadexApi from 'mangadex-api'
import { Downloader } from '../caching/download.js'
import { Uploader } from '../caching/upload.js'
import { templates } from '../lib/index.js'
import { bot } from '../core/bot.js'
const { createStore, createEvent, createEffect } = effector

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
export const removeChapter = createEvent('remove chapter')
export const addChapter = createEvent('add chapter')
export const users = createStore(new Map())
  .on(addUser, (state, user) => {
    user.chapters.forEach(chapter => {
      addChapter(chapter)
    })
    if (state.has(user.id)) {
      const stateUser = state.get(user.id)
      stateUser.chapters = stateUser.chapters.concat(
        user.chapters.map(({ id }) => id)
      )
    } else {
      state.set(user.id, {
        ...user,
        chapters: user.chapters.map(({ id }) => id)
      })
    }
    return state
  })
  .on(removeUser, (state, userId) => {
    state.delete(userId)
    return state
  })
  .on(removeChapter, (state, chapterId) => {
    state.forEach((key, val) => {
      val.chapters = val.chapters.filter(id => id !== chapterId)
      if (val.chapters.length === 0) {
        state.delete(key)
      }
    })
  })
  .on(addUserMessage.done, (state, { params, result }) => {
    const user = state.get(params.userId)
    user.message_id = result.message_id
    return state
  })
  .on(addUserMessage.fail, (state, { params }) => {
    const user = state.get(params.userId)
    user.message_id = null
    return state
  })

export const chapters = createStore(new Map())
  .on(addChapter, (state, chapter) => {
    if (!state.has(chapter.id)) {
      state.set(chapter.id, chapter)
    }
    return state
  })
  .on(removeChapter, (state, chapterId) => {
    state.delete(chapterId)
    return state
  })

const getSubscribedUsers = (chapterId) => {
  const state = users.getState()
  return Array.from(state).filter(
    ([userId, user]) =>
      user.chapters.some(({ id }) => id === chapterId) && Number.isInteger(user.message_id)
  )
}

const notify = createEffect('notify users', {
  handler: async ({ id, type, data }) => {
    const subUsers = getSubscribedUsers(id)
    const chapter = chapters.getState().get(id)
    let messageText = ''
    const messageOptions = {}
    if (type) {
      switch (type) {
        case 'start': {
          messageText = `Start caching ${templates.chapter.formatChapter(chapter)} of ${chapter.manga.title}`
          break
        }
        case 'upload': {
          messageText = `${templates.chapter.formatChapter(chapter)} ${chapter.manga.title}\nUploaded ${data.progress.toFixed(0)}% (${data.uploaded}/${data.pages})`
          break
        }
        case 'download': {
          messageText = `${templates.chapter.formatChapter(chapter)} ${chapter.manga.title}\nDownloaded ${data.progress.toFixed(0)}% (${data.downloaded}/${data.pages})`
          break
        }
        case 'error': {
          messageText = templates.error(data)
          break
        }
      }
    }
    for (const [userId, user] of subUsers) {
      if (!user.message_id) {
        try {
          await addUserMessage({
            userId,
            messageText,
            messageOptions
          })
        } catch (e) {}
      } else {
        try {
          await bot.telegram.editMessageText(
            id,
            user.message_id,
            undefined,
            messageText,
            messageOptions
          )
        } catch (e) {}
      }
    }
  }
})

export const cacheChapterFx = createEffect('cache chapter', {
  handler: async (chapter) => {
    return new Promise((resolve, reject) => {
      const { id, page_array } = chapter

      let progressEmmited = Date.now()
      const download = new Downloader(id, page_array)
      const upload = new Uploader()

      notify({ id, type: 'start' })

      const onUploadProgress = data => {
        if (Date.now() - progressEmmited > 2500) {
          notify({ id, type: 'upload', data })
          progressEmmited = Date.now()
        }
      }

      const onUploadError = err => {
        cleanUploadProcess()
        notify({ id, type: 'error', data: err })
      }

      const uploadToTelegraph = async files => {
        const { url } = await telegraphUpload({
          chapter,
          files
        })
        return url
      }

      const onUploadDone = async files => {
        cleanUploadProcess()
        try {
          await cleanCacheDirectory(id)
        } catch (e) {
          return notify({ id, type: 'error', data: e })
        }
        try {
          const telegraphUrl = await uploadToTelegraph(files)
          notify({ id, type: 'done', data: telegraphUrl })
        } catch (e) {
          notify({ id, type: 'error', data: e })
        }
      }

      const onDownloadProgress = data => {
        if (Date.now() - progressEmmited > 2500) {
          notify({ id, type: 'download', data })
          progressEmmited = Date.now()
        }
      }
      const onDownloadError = async err => {
        cleanDownloadProcess()
        cleanUploadProcess()
        try {
          await cleanCacheDirectory(id)
        } catch (e) {
          notify({ id, type: 'error', data: e })
        }
        notify({ id, type: 'error', data: err })
      }

      const onDownloadDone = async pages => {
        cleanDownloadProcess()
        upload.setPages = pages
        try {
          await upload.upload()
        } catch (e) {
          onUploadError(e)
        }
      }

      const cleanDownloadProcess = () => {
        download.removeListener('progress', onDownloadProgress)
        download.removeListener('done', onDownloadDone)
      }

      const cleanUploadProcess = () => {
        upload.removeListener('progress', onUploadProgress)
        upload.removeListener('done', onUploadDone)
      }

      download.on('downloaded', onDownloadProgress)
      download.on('done', onDownloadDone)
      upload.on('uploaded', onUploadProgress)
      upload.on('done', onUploadDone)
      try {
        download.download()
      } catch (e) {
        onDownloadError(e)
      }
    })
  }
})

// .on(setCurrentChapter, (state, id) => ({
//   ...state,
//   current_chapter_id: id
// }))

// export const getChapter = createEffect('get chapter', {
//   handler: async ({ chapterId, fromId }) => {
//     const chapterInDb = await collection('chapters').findOne({ id: chapterId })
//     if (chapterInDb) {
//       // await collection('chapters').updateOne({ id: chapterId }, { $addToSet: {  } })

//       return {
//         ok: true,
//         chapter: chapterInDb
//       }
//     }
//     try {
//       const chapter = await MangadexApi.getChapter(chapterId)
//       await collection('chapters').create(chapter)
//       await sleep(1000)
//       return {
//         ok: true,
//         chapter
//       }
//     } catch (e) {
//       return {
//         ok: false,
//         type: 'error',
//         error: e
//       }
//     }
//   }
// })

// export const cacheChapter = createEvent('cache chapter')

// store.on(cacheChapter, (state, { message, from, chapter }) => {
//   const user = state.users.find(({ id }) => id === from.id)
//   if (user) {
//     const followed_chapter = user.chapters.find(({ id }) => id === chapter.id)
//     if (followed_chapter) {
//       followed_chapter.messages.push(message.message_id)
//     } else {
//       user.chapters.push({
//         id: chapter.id,
//         messages: [message.message_id]
//       })
//     }
//   } else {
//     state.users.push({
//       id: from.id,
//       chapters: [{
//         id: chapter.id,
//         messages: [message.message_id]
//       }]
//     })
//   }

//   const cachingChapter = state.chapters.find(({ id }) => id === chapter.id)
//   if (!cachingChapter) {
//     state.chapters.push({
//       id: chapter.id,
//       cached: [],
//       pages: chapter.pages,
//       chapter_data: chapter
//     })
//   }

//   return {
//     ...state
//   }
// })

// const notifyUsers = async (type, message) => {
//   const state = store.getState()

//   const users = state.chapters.find(({ id }) => id === state.current_chapter_id)
  
// }

const proceedChapter = createEffect('proceed chapter', {
  handler: async () => {
    const state = store.getState()
    const chapter = state.chapters.shift()

    setCurrentChapter(chapter.id)

    let progressEmmited = Date.now()
    const download = new Downloader(id, pages)
    const upload = new Uploader()

    publish(id, 'start')

    function reportProgress (type, data) {
      publish(id, type, { data })
    }

    const onUploadProgress = data => {
      if (Date.now() - progressEmmited > 2500) {
        reportProgress('upload', data)
        progressEmmited = Date.now()
      }
    }

    const onUploadError = err => {
      cleanUploadProcess()
      publish(id, 'error', { data: err })
    }

    const uploadToTelegraph = async files => {
      const { url } = await telegraphUpload({
        chapter,
        manga,
        images: files,
        username: process.env.BOT_USERNAME || 'mymanga_bot'
      })
      return url
    }

    const onUploadDone = async files => {
      cleanUploadProcess()
      try {
        await cleanCacheDirectory(id)
      } catch (e) {
        return publish(id, 'error', { data: e })
      }
      try {
        const telegraphUrl = await uploadToTelegraph(files)
        publish(id, 'done', { data: telegraphUrl })
      } catch (e) {
        publish(id, 'error', { data: e })
      }
    }

    const onDownloadProgress = data => {
      if (Date.now() - progressEmmited > 2500) {
        reportProgress('download', data)
        progressEmmited = Date.now()
      }
    }
    const onDownloadError = async err => {
      cleanDownloadProcess()
      cleanUploadProcess()
      try {
        await cleanCacheDirectory(id)
      } catch (e) {
        publish(id, 'error', { data: e })
      }
      publish(id, 'error', { data: err })
    }

    const onDownloadDone = async pages => {
      cleanDownloadProcess()
      upload.setPages = pages
      try {
        await upload.upload()
      } catch (e) {
        onUploadError(e)
      }
    }

    const cleanDownloadProcess = () => {
      download.removeListener('progress', onDownloadProgress)
      download.removeListener('done', onDownloadDone)
    }

    const cleanUploadProcess = () => {
      upload.removeListener('progress', onUploadProgress)
      upload.removeListener('done', onUploadDone)
    }

    download.on('downloaded', onDownloadProgress)
    download.on('done', onDownloadDone)
    upload.on('uploaded', onUploadProgress)
    upload.on('done', onUploadDone)

    return download.download()
      .catch(err => {
        onDownloadError(err)
      })
  }
})

// store.on(proceedChapter.pending, (state, working) => ({
//   ...state,
//   working
// }))

// const startWorking = createEffect('start working', {
//   handler: async () => {
//     const state = store.getState()
//     if (state.working) {
//       return undefined
//     }
//     proceedChapter()
//   }
// })

// const getUsers = createEffect('get chapter users', {
//   handler: () => {
//     const state = store.getState()

//     const users = []
//   }
// })

// forward({
//   from: merge([
//     cacheChapter,
//     proceedChapter.done
//   ]),
//   to: startWorking
// })
