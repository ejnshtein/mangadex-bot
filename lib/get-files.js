const axios = require('axios').default
const collection = require('../core/database')
const telegraphUpload = require('./telegraph-upload')
const sharp = require('sharp')
const FormData = require('form-data')

let blockCaching = false
let blockUpdateCache = false

const cachePool = {}
const updatePool = {}

module.exports = async (chapter, manga, ctx, offset = 0, history = 'p=1:o=0') => {
  const cachedChapter = await collection('chapters').findOne({ id: chapter.id }).exec()
  if (cachedChapter) {
    if (cachedChapter.timestamp === chapter.timestamp) {
      chapter.telegraph = cachedChapter.telegraph
      return chapter
    } else {
      return new Promise(async (resolve) => {
        chapter.telegraph = cachedChapter.telegraph
        resolve(chapter)
        if (updatePool[chapter.id]) {
          return
        } else {
          if (blockUpdateCache) { return }
          updatePool[chapter.id] = true
        }
        const telegraphPage = await uploadChapter(chapter, ctx.me)
        await collection('chapters').updateOne({
          id: chapter.id
        }, {
          $set: {
            telegraph: telegraphPage.url,
            timestamp: chapter.timestamp
          }
        }).exec()
        delete updatePool[chapter.id]
      })
    }
  } else {
    if (blockCaching) {
      return null
    }
    try {
      await ctx.answerCbQuery(
        'This chapter has been not cached yet, I\'ll let you know when it will be ready!\nUsually it takes ~1 min to cache all pages.',
        true,
        {
          cache_time: 10
        }
      )
    } catch (e) {}
    if (cachePool[chapter.id]) {
      if (!cachePool[chapter.id].some(el => el.userId === ctx.from.id)) {
        cachePool[chapter.id].push({
          userId: ctx.from.id
        })
      }
      return null
    }

    cachePool[chapter.id] = [
      {
        userId: ctx.from.id
      }
    ]
    const telegraphPage = await uploadChapter(chapter, manga, ctx.me)
    await collection('chapters').create({
      id: chapter.id,
      telegraph: telegraphPage.url,
      timestamp: chapter.timestamp,
      manga_id: chapter.manga_id,
      manga_title: manga.manga.title
    })
    chapter.telegraph = telegraphPage.url
    for (const promise of cachePool[chapter.id].map(el =>
      ctx.telegram.sendMessage(
        el.userId,
        `${chapter.volume ? `Vol. ${chapter.volume} ` : ''}Chapter ${chapter.chapter} ready for reading!`,
        {
          reply_to_message_id: ctx.callbackQuery.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Ok!',
                  callback_data: 'delete'
                },
                {
                  text: 'Load chapter',
                  callback_data: `chapter=${chapter.id}:read=false:copy=true:offset=${offset}:${history}`
                }
              ]
            ]
          }
        }
      )
    )
    ) {
      try {
        await promise
      } catch (e) {}
    }
    delete cachePool[chapter.id]
    return null
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
    let picEdited = false
    if (meta.size > 5 * 1e6) {
      pic.resize(1500)
      var picBuff = await pic.toBuffer()
      picEdited = true
    }
    let file
    try {
      file = await uploadFile({ name: img, file: picEdited ? picBuff : buffer })
    } catch (e) {
      pic.resize(1280)
      picBuff = await pic.toBuffer()
      file = await uploadFile({ name: img, file: picBuff })
    }
    pics.push(file[0].src)
  }
  return telegraphUpload(chapter, manga, pics, me)
}
