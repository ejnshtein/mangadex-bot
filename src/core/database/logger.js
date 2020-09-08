import collection from './index.js'
const users = collection('users')

export default async function logger ({ updateType, chat, from, state }, next) {
  if (
    updateType === 'callback_query' ||
    (updateType === 'message' && chat.type === 'private')
  ) {
    const { id, ...userData } = from
    state.user = await users.findOneAndUpdate(
      { id },
      { $set: userData },
      { new: true }
    )
    if (!state.user) {
      state.user = await users.create(from)
    }
  }
  next()
}
