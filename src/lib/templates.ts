export const templates = {
  date: (date = new Date()): string =>
    `${date.toISOString().replace(/-/gi, '.').replace('T', ' ').slice(0, 23)}`
}
