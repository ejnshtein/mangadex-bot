import fs from 'fs'
import { telegraphUpload } from '../lib/index.js'
import FormData from 'form-data'
import { sleep } from '@ejnshtein/tools'
import { createStore, createEvent, createEffect, forward, sample } from 'effector-esm'

export const setChapterData = createEvent('set chapter data for uploader')
const reset = createEvent('reset store')

const uploadFile = createEffect('upload file', {
  handler: async (stream) => {
    const form = new FormData()
    form.append('data', stream)
    return new Promise((resolve, reject) => {
      form.submit('https://telegra.ph/upload', (err, res) => {
        if (err) {
          return reject(err)
        }
        const data = []
        res.on('data', chunk => {
          data.push(chunk)
        })
        res.on('end', () => {
          resolve(JSON.parse(data.join('')))
        })
        res.on('error', reject)
      })
    })
  }
})

const uploadChapterFx = createEffect('upload chapter', {
  handler: async ({ chapter, manga, uploaded_pages }) => {
    const result = await telegraphUpload({
      chapter,
      manga,
      pages: uploaded_pages
    })

    return result.url
  }
})

export const store = createStore({
  chapterId: null,
  pages: [],
  uploaded_pages: [],
  manga: null,
  chapter: null,
  telegraph_url: ''
})
  .on(
    uploadFile.doneData,
    (state, page) => ({
      ...state,
      uploaded_pages: [
        ...state.uploaded_pages,
        page[0].src
      ]
    })
  )
  .on(
    setChapterData,
    (state, { chapterId, chapter, manga, pages }) => ({
      ...state,
      chapterId,
      chapter,
      manga,
      pages
    })
  )
  .on(
    uploadChapterFx,
    (state, telegraph_url) => ({
      ...state,
      telegraph_url
    })
  )
  .reset(reset)

export const progress = store.map(({ uploaded_pages, pages }) => (uploaded_pages.length / pages.length) * 100)
export const uploadedCount = store.map(({ uploaded_pages }) => uploaded_pages.length)
export const uploaded = store.map(({ telegraph_url }) => Boolean(telegraph_url))

export const upload = createEvent('upload chapter')

const uploadPagesFx = createEffect('pages upload upload', {
  handler: async ({ pages }) => {
    for (const page of pages) {
      await uploadFile(fs.createReadStream(page))
      await sleep(1500)
    }
  }
})

forward({
  from: upload,
  to: sample(store, uploadPagesFx)
})

forward({
  from: uploadPagesFx.done,
  to: sample(store, uploadChapterFx)
})
