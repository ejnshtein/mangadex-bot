import { sleep } from '@ejnshtein/tools'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import request from '@ejnshtein/smol-request'
import {
  createStore,
  createEvent,
  createEffect,
  sample
} from 'effector-esm'

const reset = createEvent('reset store')
export const setChapterData = createEvent('set chapter data for downloader')

const resizeImage = createEffect('resize image', {
  handler: async (imagePath) => {
    const img = sharp(imagePath)
    const { size } = await fs.promises.stat(imagePath)
    if (size < 5e6) {
      return imagePath
    }
    const { width } = await img.metadata()
    const { name, dir, ext } = path.parse(imagePath)
    const newWidth = width - 10
    img.resize(newWidth)
    const originalName = name.split(':').shift()
    const imgPath = path.resolve(
      dir,
      `${originalName}:${newWidth}.${ext}`
    )
    await img.toFile(imgPath)
    return resizeImage(imgPath)
  }
})

export const store = createStore({
  chapterId: null,
  pages: [],
  downloaded_pages: []
})
  .on(
    resizeImage.doneData,
    (state, page) => ({
      ...state,
      downloaded_pages: [
        ...state.downloaded_pages,
        page
      ]
    })
  )
  .on(
    setChapterData,
    (state, { chapterId, pages }) => ({
      ...state,
      chapterId,
      pages
    })
  )
  .reset(reset)

export const progress = store.map(({ downloaded_pages, pages }) => (downloaded_pages.length / pages.length) * 100)
export const downloaded = store.map(({ downloaded_pages }) => downloaded_pages.length)

export const downloadFx = createEffect('chapter downlad', {
  handler: async ({ chapterId, pages }) => {
    await fs.promises.mkdir(`./.tmp/${chapterId}`)
    for (const pageUrl of pages) {
      const downloadedPagePath = await downloadPage({
        contentPath: `./.tmp/${chapterId}`,
        url: pageUrl
      })
      await resizeImage(downloadedPagePath)
      await sleep(1500)
    }
  }
})

export const download = sample(store, downloadFx)

async function downloadPage ({ contentPath, url }) {
  const { data: stream } = await request(url, { responseType: 'stream' })
  const { name, ext } = path.parse(url)

  const storePath = path.resolve(contentPath, `${name}${ext}`)
  const writeStream = fs.createWriteStream(storePath)

  return new Promise((resolve, reject) => {
    stream.pipe(writeStream)
    stream.once('error', reject)
    stream.once('finish', () => {
      resolve(storePath)
    })
  })
}
