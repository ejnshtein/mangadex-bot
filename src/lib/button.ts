export const offset = {
  plus: (plus = 10): string => `⬇ ${plus}`,
  minus: (minus = 10): string => `⬆ ${minus}`
}
export const page = {
  next: (page = 1): string => `${page} ›`,
  nextDub: (page: number): string => `${page} »`,
  prev: (page = 1): string => `‹ ${page}`,
  prevDub: (page = 0): string => `« ${page}`,
  locate: (page: number): string => `· ${page} ·`
}

export const favorite = (value = true): string => (value ? '💖' : '💔')

export const refresh = (): string => '↻'
export const back = (): string => '⬅'
export const next = (): string => '➡'
export const share = (): string => '☞'
