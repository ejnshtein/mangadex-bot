const offset = {
  plus: (plus = 10) => `⬇ ${plus}`,
  minus: (minus = 10) => `⬆ ${minus}`
}
const page = {
  next: (page = 1) => `${page} ›`,
  nextDub: page => `${page} »`,
  prev: (page = 1) => `‹ ${page}`,
  prevDub: (page = 0) => `« ${page}`,
  locate: page => `· ${page} ·`,
  refresh: () => '↻ Refresh'
}
const back = '⬅ Back'
const next = 'Next ➡'
const share = `☞ Share`
function favorite (value = true) { return value ? '💖' : '💔' }

export default {
  offset,
  page,
  back,
  next,
  share,
  favorite
}
