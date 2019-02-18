const axios = require('axios').default
const collection = require('../core/database')
const telegraphUpload = require('./telegraph-upload')
const sharp = require('sharp')
const FormData = require('form-data')
let blockCaching = false
let blockUpdateCache = false

const cachePool = {}
const updatePool = {}

module.exports = async (chapter, manga, ctx, offset = 0, history = 'p=1:o=0', messageId = undefined, quite = false) => {
  const cachedChapter = await collection('chapters').findOne({ id: chapter.id }).exec()
  if (cachedChapter) {
    if (cachedChapter.timestamp === chapter.timestamp) {
      chapter.telegraph = cachedChapter.telegraph
      return {
        ok: true,
        chapter
      }
    } else {
      return new Promise(async resolve => {
        resolve({
          ok: true,
          chapter
        })
        if (updatePool[chapter.id]) {
          return
        } else {
          if (blockUpdateCache) { return }
          updatePool[chapter.id] = true
        }
        const telegraphPage = await uploadChapter(chapter, manga, ctx.me)
        await collection('chapters').updateOne({ id: chapter.id }, { $set: { telegraph: telegraphPage.url, timestamp: chapter.timestamp } }).exec()
        delete updatePool[chapter.id]
      })
    }
  } else {
    return new Promise(async resolve => {
      if (blockCaching) {
        return resolve({ ok: false, message: `Sorry, caching isn't available right now.\nThis can be because of bot update or malfunction.` })
      }
      if (!quite) {
        resolve({ ok: true, message: `This chapter has been not cached yet, I'll let you know when it will be ready!\nUsually it takes ~1 min to cache all pages.` })
      }
      if (cachePool[chapter.id]) {
        if (!cachePool[chapter.id].some(el => el.userId === ctx.from.id)) {
          cachePool[chapter.id].push({
            userId: ctx.from.id,
            offset,
            history,
            messageId
          })
        }
        return
      }

      cachePool[chapter.id] = [
        {
          userId: ctx.from.id,
          offset,
          history,
          messageId
        }
      ]
      const telegraphPage = await uploadChapter(chapter, manga, ctx.me)
      await collection('chapters').create({
        id: chapter.id,
        telegraph: telegraphPage.url,
        timestamp: chapter.timestamp,
        manga_id: chapter.manga_id,
        manga_title: manga.title
      })
      chapter.telegraph = telegraphPage.url
      if (!quite) {
        for (const promise of cachePool[chapter.id].map(el =>
          ctx.telegram.sendMessage(
            el.userId,
            `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Chapter ${chapter.chapter} ready for reading!`,
            {
              reply_to_message_id: el.messageId ? el.messageId : undefined,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Ok!',
                      callback_data: 'delete'
                    },
                    {
                      text: 'Load chapter',
                      callback_data: `chapter=${chapter.id}:read=false:copy=false:offset=${el.offset}:${el.history}`
                    }
                  ]
                ]
              }
            }
          )
        )
        ) {
          await promise
        }
      } else {
        resolve({
          ok: true,
          chapter,
          users: cachePool[chapter.id]
        })
        delete cachePool[chapter.id]
      }
    })
  }
}

module.exports.cachePool = () => cachePool
module.exports.updatePool = () => updatePool
module.exports.getCacheBlockingValue = () => blockCaching
module.exports.setCachingBlocking = value => {
  blockCaching = value
}
module.exports.getUpdateCachingBlockingValue = () => blockUpdateCache
module.exports.setUpdateCachingBlocking = value => {
  blockUpdateCache = value
}

async function downloadImage (url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer'
  })

  return Buffer.from(response.data)
}

async function uploadFile (file) {
  const form = new FormData()
  form.append(`data`, file.file, {
    filename: file.name
  })
  return new Promise((resolve, reject) => {
    form.submit('https://telegra.ph/upload', (err, res) => {
      if (err) return reject(err)
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', reject)
    })
  })
}

async function uploadChapter (chapter, manga, me) {
  const pics = []
  for (const img of chapter.page_array) {
    const buffer = await downloadImage(img)
    const pic = sharp(buffer)
    const meta = await pic.metadata()
    const file = await uploadChapterPhoto(img, meta.size > 5 * 1e6 ? 1500 : meta.width, pic)
    pics.push(file)
  }
  await sleep(500)
  return telegraphUpload(chapter, manga, pics, me)
}

async function uploadChapterPhoto (img, size, pic) {
  pic.resize(size)
  const buff = await pic.toBuffer()
  let file
  try {
    file = await uploadFile({ name: img, file: buff })
  } catch (e) {
    return uploadChapterPhoto(img, size - 100, pic)
  }
  if (file.error) {
    return uploadChapterPhoto(img, size, pic)
  } else {
    return file[0].src
  }
}

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))
