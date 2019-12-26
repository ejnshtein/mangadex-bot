const Composer = require('telegraf/composer')
const composer = new Composer()
const { templates } = require('../lib')

composer.command('ddosmode', async ctx => {
  if (ctx.from.id !== process.env.ADMIN_ID) { return }
  const currentMode = await ctx.collection('settings').findOne({ key: 'ddos' }).exec()
  ctx.reply(
    `Current DDOS mode: ${currentMode.value ? 'on' : 'off'}`,
    {
      reply_markup: {
        inline_keyboard: [
          {
            text: currentMode.value ? 'Off' : 'On',
            callback_data: `ddos=${currentMode.value ? 'off' : 'on'}`
          }
        ]
      }
    }
  )
})

composer.action('ddosrefresh', async ctx => {
  ctx.answerCbQuery('')
  if (ctx.from.id !== process.env.ADMIN_ID) { return }
  const currentMode = await ctx.collection('settings').findOne({ key: 'ddos' }).exec()
  ctx.editMessageText(
    `Current DDOS mode: ${currentMode.value ? 'on' : 'off'}`,
    {
      reply_markup: {
        inline_keyboard: [
          {
            text: currentMode.value ? 'Off' : 'On',
            callback_data: `ddos=${currentMode.value ? 'off' : 'on'}`
          }
        ]
      }
    }
  )
})

composer.action(/^ddos=(\S+)$/i, async ctx => {
  if (ctx.from.id !== process.env.ADMIN_ID) { return }
  switch (ctx.match[1]) {
    case 'on':
      try {
        await ctx.collection('settings').updateOne({ key: 'ddos' }, { $set: { value: true } }).exec()
      } catch (e) {
        return ctx.answerCbQuery(e.message)
      }
      break
    case 'off':
      try {
        await ctx.collection('settings').updateOne({ key: 'ddos' }, { $set: { value: false } }).exec()
      } catch (e) {
        return ctx.answerCbQuery(e.message)
      }
      break
  }
  ctx.answerCbQuery('Done')
})

module.exports = app => {
  app.use(composer.middleware())
}

function keyboard (value) {
  return [
    [
      {
        text: 'Refresh',
        callback_data: `ddosrefresh`
      },
      {
        text: `${value ? 'Off' : 'On'}`,
        callback_data: `ddos=${value ? 'off' : 'on'}`
      }
    ]
  ]
}
