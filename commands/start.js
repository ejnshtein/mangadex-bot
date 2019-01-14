const Composer = require('telegraf/composer')
const composer = new Composer()
const { buffer } = require('../lib')
const { mangaView, mangaSearchView } = require('../generators')

composer.start(async ctx => {
  if (/\/start (\S+)/i.test(ctx.message.text)) {
    const data = ctx.message.text.match(/\/start (\S+)/i)[1]
    const text = buffer.decode(data)
    if (/manga:[0-9]+/i.test(text)) {
      const mangaId = text.match(/manga:([0-9]+)/i)[1]
      const { text: messageText, extra } = await mangaView(mangaId)
      try {
        await ctx.reply(messageText, extra)
        return
      } catch (e) {}
    } else if (/search:[\S\s]+/i.test(text)) {
      const query = text.match(/search:([\S\s])+/i)[1]
      const { text: messageText, extra } = await mangaSearchView(query)
      try {
        await ctx.reply(messageText, extra)
        return
      } catch (e) {}
    }
  // TO-DO: make something like view in ./generators in nyaasi_bot+
  // console.log(ctx.match)
  // console.log(extra.reply_markup.inline_keyboard)
  }
  ctx.reply(`Hello!\nI'm <a href="https://mangadex.org">Mangadex</a> bot.\nI can send to you chapters from your favorite manga right here, in Telegram*!\n\n*Telegra.ph + Instant view on mobile, and just telegra.ph links for desktop version.`)
})

module.exports = app => {
  app.use(composer.middleware())
}
