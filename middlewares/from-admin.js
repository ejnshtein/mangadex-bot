module.exports = () => ({ from }, next) => {
  if (from.id === process.env.ADMIN_ID) {
    if (typeof next === 'function') {
      return next()
    } else {
      return true
    }
  }
  return false
}
