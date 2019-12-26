import FormData from 'form-data'

export default async file => {
  const form = new FormData()
  form.append('data', file.file, {
    filename: file.name
  })
  return new Promise((resolve, reject) => {
    form.submit('https://telegra.ph/upload', (err, res) => {
      if (err) return reject(err)
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => resolve(JSON.parse(data)))
      res.on('error', reject)
    })
  })
}
