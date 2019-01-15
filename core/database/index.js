const mongoose = require('mongoose')
const { Schema } = mongoose

const connection = mongoose.createConnection(process.env.DATABASE_URL, {
  useNewUrlParser: true
})

connection.then(() => {
  console.log('DB connected')
})

connection.catch(e => {
  console.log('DB error', e)
})

const collections = [
  {
    name: 'users',
    schema: new Schema({
      id: { type: Number, unique: true },
      username: { type: String, required: false },
      first_name: { type: String, required: false },
      last_name: { type: String, required: false },
      last_update: { type: Date, default: () => Date.now() },
      favorite_titles: { type: [Number], default: [], required: false }
    }, {
      timestamps: {
        updatedAt: 'updated_at',
        createdAt: 'created_at'
      }
    })
  },
  {
    name: 'chapters',
    schema: new Schema({
      id: {
        type: Number,
        unique: true
      },
      telegraph: {
        type: String,
        required: true
      },
      manga_id: { type: Number, required: false },
      manga_title: { type: String, required: false },
      timestamp: Number
    }, {
      timestamps: {
        updatedAt: 'updated_at',
        createdAt: 'created_at'
      }
    })
  }
]

module.exports = collectionName => {
  const collection = collections.find(el => el.name === collectionName)
  if (collection) {
    return connection.model(collection.name, collection.schema)
  } else {
    throw new Error('Collection not found')
  }
}
