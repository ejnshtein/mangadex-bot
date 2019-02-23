const Composer = require('telegraf/composer')
const composer = new Composer()
const getFiles = require('../lib/cache-chapter')
const { templates } = require('../lib')

composer.command('pool', async ctx => {
  if (ctx.from.id === Number.parseInt(process.env.ADMIN_ID)) {
    ctx.reply(`Here's ${getFiles.cachePoolSize()} chapters waiting to be cached.\nUpdated: ${templates.date()}`, {
      reply_markup: {
        inline_keyboard: cacheKeyboard(
          getFiles.getCacheBlockingValue(),
          getFiles.getUpdateCachingBlockingValue()
        )
      }
    })
  }
})

composer.action('cachepoolrefresh', async ctx => {
  if (ctx.from.id === Number.parseInt(process.env.ADMIN_ID)) {
    ctx.editMessageText(`Here's ${getFiles.cachePoolSize()} chapters waiting to be cached.\nUpdated: ${templates.date()}`, {
      reply_markup: {
        inline_keyboard: cacheKeyboard(
          getFiles.getCacheBlockingValue(),
          getFiles.getUpdateCachingBlockingValue()
        )
      }
    })
  }
})

composer.action(/^cachepool=(\S+)$/i, async ctx => {
  if (ctx.from.id === Number.parseInt(process.env.ADMIN_ID)) {
    switch (ctx.match[1]) {
      case 'on':
        getFiles.setCachingBlocking(true)
        break
      case 'off':
        getFiles.setCachingBlocking(false)
        break
    }
    ctx.editMessageReplyMarkup({
      inline_keyboard: cacheKeyboard(
        getFiles.getCacheBlockingValue(),
        getFiles.getUpdateCachingBlockingValue()
      )
    })
  } else {
    return ctx.editMessageReplyMarkup({ inline_keyboard: [] })
  }
})

composer.action(/^updatecache=(\S+)$/i, async ctx => {
  if (ctx.from.id === Number.parseInt(process.env.ADMIN_ID)) {
    switch (ctx.match[1]) {
      case 'on':
        getFiles.setUpdateCachingBlocking(true)
        break
      case 'off':
        getFiles.setUpdateCachingBlocking(false)
        break
    }
    ctx.editMessageReplyMarkup({
      inline_keyboard: cacheKeyboard(
        getFiles.getCacheBlockingValue(),
        getFiles.getUpdateCachingBlockingValue()
      )
    })
  } else {
    return ctx.editMessageReplyMarkup({ inline_keyboard: [] })
  }
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
