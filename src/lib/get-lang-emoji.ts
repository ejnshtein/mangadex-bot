const langcodesWithEmojis = require('../../config/lang-code-emoji.json')

export function getLangEmoji(langCode: string): string {
  return langcodesWithEmojis[langCode] || ''
}
