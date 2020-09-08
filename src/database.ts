import * as mongoose from 'mongoose'
import env from './env.js'

const { createConnection } = mongoose

export const connection = createConnection(env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: true
})

connection.then(() => {
  console.log('DB connected')
})

connection.catch(e => {
  console.log('DB error', e)
})
