module.exports = ({ chat }, next) => {
  if (chat.type === 'private') {
    if (typeof next === 'function') {
      next()
    } else {
      return true
    }
  }
}
