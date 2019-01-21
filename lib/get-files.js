const axios = require('axios').default
const collection = require('../core/database')
const cacheFile = require('./cache-file')
const sharp = require('sharp')
const FormData = require('form-data')
const { getManga } = require('../mangadex')

const cachePoll = {}
const updatePoll = {} // soon

module.exports = async (chapter, ctx) => {
  const cachedData = await collection('chapters').findOne({ id: chapter.id }).exec()
  if (cachedData) {
    if (cachedData.timestamp === chapter.timestamp) {
      chapter.telegraph = cachedData.telegraph
      return chapter
    } else {
      // This needs to send chapter to user immediately
      return new Promise(async (resolve) => {
        chapter.telegraph = cachedData.telegraph
        resolve(chapter)
        if (updatePoll[chapter.id]) return
        else { updatePoll[chapter.id] = true }
        const pics = []
        for (const img of chapter.page_array) {
          // console.log(`${chapter.server}${chapter.hash}/${img}`)
          const buffer = await downloadImage(`${chapter.server === '/data/' ? 'https://mangadex.org/data/' : chapter.server}${chapter.hash}/${img}`)
          // console.log(img)
          const pic = sharp(buffer)
          const meta = await pic.metadata()
          let picEdited = false
          if (meta.size > 5 * 1e6) {
            pic.resize(null, 1920)
            picEdited = true
          }

          pics.push((await uploadFile({ name: img, file: picEdited ? await pic.toBuffer() : buffer }))[0].src)
          // const { photo } = await cacheFile(picEdited ? await pic.toBuffer() : buffer)
          // fileIds.push(photo[photo.length - 1].file_id)
        }
        const telegraphPage = await cacheFile.telegraph(chapter, pics, ctx.me)
        // console.log(telegraphPage)
        await collection('chapters').updateOne({
          id: chapter.id
        }, {
          $set: {
            telegraph: telegraphPage.url,
            timestamp: chapter.timestamp
          }
        }).exec()
      })
    }
  } else {
    try {
      await ctx.answerCbQuery(
        'This chapter has been not cached yet, I\'ll let you know when it will be ready!\nUsually it takes ~1 min to cache all pages.',
        true,
        {
          cache_time: 10
        }
      )
    } catch (e) {}
    if (cachePoll[chapter.id]) {
      if (!cachePoll[chapter.id].find(el => el.userId === ctx.from.id)) {
        cachePoll[chapter.id].push({
          userId: ctx.from.id
        })
      }
      return null
    }

    cachePoll[chapter.id] = [{
      userId: ctx.from.id
    }]
    // console.log(chapter)
    const pics = []
    for (const img of chapter.page_array) {
      // console.log(`${chapter.server}${chapter.hash}/${img}`)
      const buffer = await downloadImage(`${chapter.server === '/data/' ? 'https://mangadex.org/data/' : chapter.server}${chapter.hash}/${img}`)
      // console.log(img)
      const pic = sharp(buffer)
      const meta = await pic.metadata()
      let picEdited = false
      if (meta.size > 5 * 1e6) {
        pic.resize(null, 1600)
        picEdited = true
      }

      pics.push((await uploadFile({ name: img, file: picEdited ? await pic.toBuffer() : buffer }))[0].src)
      // const { photo } = await cacheFile(picEdited ? await pic.toBuffer() : buffer)
      // fileIds.push(photo[photo.length - 1].file_id)
    }
    const telegraphPage = await cacheFile.telegraph(chapter, pics, ctx.me)
    // console.log(telegraphPage)
    await collection('chapters').create({
      id: chapter.id,
      telegraph: telegraphPage.url,
      timestamp: chapter.timestamp,
      manga_id: chapter.manga_id,
      manga_title: (await getManga(chapter.manga_id)).manga.title
    })
    chapter.telegraph = telegraphPage.url
    await Promise.all(
      cachePoll[chapter.id]
        .map(el =>
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
                    }
                  ]
                ]
              }
            }
          )
        )
    )
    return null
  }
}

async function downloadImage (url) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer'
  })

  return Buffer.from(response.data)
}

async function uploadFile (file) {
  const form = new FormData()
  form.append(`data`, file.file, {
    filename: file.name
  })
  const res = await new Promise((resolve, reject) => {
    form.submit('https://telegra.ph/upload', (err, res) => {
      let data = ''
      res.on('data', chunk => data += chunk )
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', reject)
    })
  })
  return res
}
