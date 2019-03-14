const Composer = require('telegraf/composer')
const composer = new Composer()
const {
  updatingCount,
  cachingCount,
  getCacheBlockingValue,
  getUpdateCachingBlockingValue,
  setCachingBlocking,
  setUpdateCachingBlocking
} = require('../lib/chapter')
const { templates } = require('../lib')

composer.command('pool', async ctx => {
  if (ctx.from.id !== process.env.ADMIN_ID) { return }
  ctx.reply(
    `Here's ${cachingCount()} chapters waiting to be cached, updating: ${updatingCount()}
Updated: ${templates.date()}`,
    {
      reply_markup: {
        inline_keyboard: cacheKeyboard(
          getCacheBlockingValue(),
          getUpdateCachingBlockingValue()
        )
      }
    })
})

composer.action('cachepoolrefresh', async ctx => {
  ctx.answerCbQuery('')
  if (ctx.from.id !== process.env.ADMIN_ID) { return }
  ctx.editMessageText(`Here's ${cachingCount()} chapters waiting to be cached, updating: ${updatingCount()}
Updated: ${templates.date()}`, {
    reply_markup: {
      inline_keyboard: cacheKeyboard(
        getCacheBlockingValue(),
        getUpdateCachingBlockingValue()
      )
    }
  })
})

composer.action(/^cachepool=(\S+)$/i, async ctx => {
  ctx.answerCbQuery('')
  if (ctx.from.id !== process.env.ADMIN_ID) { return ctx.editMessageReplyMarkup({ inline_keyboard: [] }) }
  switch (ctx.match[1]) {
    case 'on':
      setCachingBlocking(true)
      break
    case 'off':
      setCachingBlocking(false)
      break
  }
  ctx.editMessageReplyMarkup({
    inline_keyboard: cacheKeyboard(
      getCacheBlockingValue(),
      getUpdateCachingBlockingValue()
    )
  })
})

composer.action(/^updatecache=(\S+)$/i, async ctx => {
  ctx.answerCbQuery('')
  if (ctx.from.id !== process.env.ADMIN_ID) { return ctx.editMessageReplyMarkup({ inline_keyboard: [] }) }
  switch (ctx.match[1]) {
    case 'on':
      setUpdateCachingBlocking(true)
      break
    case 'off':
      setUpdateCachingBlocking(false)
      break
  }
  ctx.editMessageReplyMarkup({
    inline_keyboard: cacheKeyboard(
      getCacheBlockingValue(),
      getUpdateCachingBlockingValue()
    )
  })
})

module.exports = app => {
  app.use(composer.middleware())
}

function cacheKeyboard (cacheBlock, updateBlock) {
  return [
    [
      {
        text: 'Refresh',
        callback_data: `cachepoolrefresh`
      },
      {
        text: `${cacheBlock ? 'Enable' : 'Disable'} caching`,
        callback_data: `cachepool=${cacheBlock ? 'off' : 'on'}`
      },
      {
        text: `${updateBlock ? 'Enable' : 'Disable'} updating`,
        callback_data: `updatecache=${updateBlock ? 'off' : 'on'}`
      }
    ]
  ]
}
