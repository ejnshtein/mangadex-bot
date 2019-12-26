import { promises as fs } from 'fs'
import path from 'path'

if (!process.env) {
  const dirs = process.argv
    .filter((_, i) => i >= 2)

  if (!dirs.length) {
    console.log('No directories in arguments was passed, exiting...')
    process.exit(1)
  }

  Promise.all(
    dirs.map(dir => cleanFiles(dir))
  )
    .then(() => console.log(`Cleanup done in directories: "${dirs.join('", ')}"`))
    .catch(err => console.log('Something went wrong ', err))
}

export default async function cleanFiles (dirPath) {
  const files = await fs.readdir(dirPath, { withFileTypes: true })
  if (files.length) {
    await Promise.all(
      files.map(async file => {
        switch (true) {
          case file.isDirectory():
            await cleanFiles(path.resolve(dirPath, file.name))
            await fs.rmdir(path.resolve(dirPath, file.name))
            break
          case file.isFile():
            await fs.unlink(path.resolve(dirPath, file.name))
            break
          default:
            console.log('What is this? ', file)
            break
        }
      })
    )
  }
}
