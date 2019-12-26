import collection from './index.js'
const users = collection('users')

export default () => async ({ updateType, chat, from, state }, next) => {
  if (updateType === 'callback_query'
    || updateType === 'message' && chat.type === 'private') {
    const user = await users.findOne({ id: from.id }).exec()
    if (user) {
      state.user = await users.findOneAndUpdate({ id: from.id }, { $set: { last_update: Date.now() } }).exec()
    } else {
      state.user = await users.create({
        id: from.id,
        username: from.username,
        first_name: from.first_name,
        last_name: from.last_name
      })
    }
  }
  next()
}
