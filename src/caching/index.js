import { promises as fs } from 'fs'
import effector from 'effector'
import cleanUp from './clean-up.js'
import { Downloader } from './download.js'
import { Uploader } from './upload.js'
import { telegraphUpload, templates, buffer } from '../lib/index.js'
import { bot } from '../core/bot.js'
import collection from '../core/database/index.js'

const { createStore, createEvent } = effector

export const worker = createStore({
  chapters: [],
  failed: [],
  working: false,
  users: [],
  batchedChapters: []
})

const startWorking = createEvent('start work')

worker.on(startWorking, (state) => {
  if (!state.working) {
    state.working = true
    const [nextChapter] = state.chapters.slice(0, 1)
    proceed(nextChapter)
  }
  return state
})

const stopWorking = createEvent('stop working')

worker.on(stopWorking, (state, doneChapterId) => {
  state.chapters = state.chapters.filter(chapter => chapter.id !== doneChapterId)
  state.users.forEach(user => {
    user.chapters = user.chapters.filter(chapterId => chapterId !== doneChapterId)
    user.message_id = null
  })
  state.users = state.users.filter(user => user.chapters.length)
  if (state.chapters.length) {
    const [nextChapter] = state.chapters.slice(0, 1)
    proceed(nextChapter)
    state.working = true
  } else {
    state.working = false
  }
  return state
})

export const addToQueue = createEvent('add chapter to queue')

worker.on(addToQueue, (state, { id, pages, chapter, manga, from, ctx }) => {
  if (state.users.some(el => el.id === from.id)) {
    const user = state.users.find(el => el.id === from.id)
    if (!user.chapters.some(el => el.id === id)) {
      user.chapters.push({
        id,
        message_id: null
      })
    }
    ctx.answerCbQuery('Working...')
  } else {
    state.users.push({
      id: from.id,
      chapters: [
        {
          id,
          message_id: null
        }
      ]
    })
    ctx.answerCbQuery('Start caching your chapter!')
  }

  if (!state.chapters.some(el => el.id === id)) {
    state.chapters.push({
      id,
      pages,
      chapter,
      manga
    })
  }

  return state
})

export const removeChapter = createEvent('remove chapter from queue')

worker.on(removeChapter, (state, chapterId) => {
  state.chapters = state.chapters.filter(el => el.id !== chapterId)

  return state
})

addToQueue.watch((payload) => {
  const state = worker.getState()

  // console.log(state.chapters.length)
  if (!state.working) {
    startWorking()
  }
})

const publish = async (chapterId, type, options) => {
  // publish to tg
  const state = worker.getState()
  const chapter = state.chapters.find(el => el.id === chapterId)
  const users = state.users.filter(user => user.chapters.some(chapter => chapter.id === chapterId))
  // console.log(chapterId, type, options)
  // console.log(state, chapter, users)
  let messageText
  let messageOptions
  switch (type) {
    case 'start':
      messageText = `Start caching ${templates.chapter.formatChapter(chapter.chapter)} of ${chapter.manga.title}`
      messageOptions = {
        parse_mode: 'HTML'
      }
      break
    case 'upload':
      messageText = `${templates.chapter.formatChapter(chapter.chapter)} ${chapter.manga.title}\nUploaded ${options.data.progress.toFixed(0)}% (${options.data.uploaded}/${options.data.pages})`
      break
    case 'download':
      messageText = `${templates.chapter.formatChapter(chapter.chapter)} ${chapter.manga.title}\nDownloaded ${options.data.progress.toFixed(0)}% (${options.data.downloaded}/${options.data.pages})`
      break
    case 'error':
      messageText = templates.error(options.data)
      removeChapter(chapterId)
      break
    case 'done':
      try {
        await collection('chapters').create({
          id: chapterId,
          title: chapter.chapter.title,
          lang: chapter.chapter.lang_code,
          chapter: chapter.chapter.chapter,
          volume: chapter.chapter.volume,
          telegraph: options.data,
          manga_id: chapter.manga.id,
          manga_title: chapter.manga.title
        })
      } catch (e) {
        messageText = templates.error(e)
        break
      }
      messageText = templates.chapter.channel(chapter.chapter, chapter.manga, options.data)
      messageOptions = {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Ok',
                callback_data: 'delete'
              }
            ],
            [
              {
                text: 'Load chapter',
                callback_data: `chapter=${chapterId}:read=0:copy=0:offset=0:p=1:o=0`
              }
            ]
          ]
        }
      }
      stopWorking(chapterId)
      try {
        await bot.telegram.sendMessage(
          process.env.CHANNEL_ID,
          messageText,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: 'Manga info',
                    url: `https://t.me/${bot.options.username}?start=${buffer.encode(`manga:${chapter.chapter.manga_id}`)}`
                  }
                ]
              ]
            }
          }
        )
      } catch (e) {}
      break
  }

  for (const user of users) {
    const { id, chapters } = user

    const userChapter = chapters.find(el => el.id === chapterId)
    if (!userChapter.message_id) {
      try {
        const message = await bot.telegram.sendMessage(
          id,
          messageText,
          messageOptions
        )
        userChapter.message_id = message.message_id
      } catch (e) {}
    } else {
      try {
        await bot.telegram.editMessageText(
          id,
          userChapter.message_id,
          undefined,
          messageText,
          messageOptions
        )
      } catch (e) {}
    }
  }
}

const cleanCacheDirectory = async id => {
  await cleanUp(`./.tmp${id ? '/' + id : id}`)
  if (id) {
    await fs.rmdir(`./.tmp/${id}`)
  }
}

cleanCacheDirectory('')
  .then(() => {
    console.log('clean up in ./.tmp/ done')
  })
  .catch(e => {
    console.log(`Error: ${e}`)
  })

export function proceed ({ id, pages, chapter, manga }) {
  // eslint-disable-next-line no-async-promise-executor
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
