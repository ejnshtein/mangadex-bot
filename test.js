const langs = require('mangadex-api/langcodes.json')
const { createInterface } = require('readline')
const fs = require('fs')

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

function getAnswer(question, defaultAnswer) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      if (!answer && defaultAnswer) {
        return resolve(defaultAnswer)
      }
      resolve(answer)
    })
  })
}

const langEmojis = {}

!(async () => {
  for (const [langcode, langname] of Object.entries(langs)) {
    const emoji = await getAnswer(
      `Enter emoji for [${langcode}] ${langname}:\n`
    )
    langEmojis[langcode] = emoji
  }

  await fs.promises.writeFile(
    './config/lang-code-emoji.json',
    JSON.stringify(langEmojis)
  )

  console.log('done')
})()
