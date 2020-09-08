import * as dotevn from 'dotenv'
import * as dotenvParseVariables from 'dotenv-parse-variables'
import argv from './lib/argv.js'
if (!process.env) {
  const env = dotevn.config({
    path: './.env'
  })
  const variables = dotenvParseVariables(env.parsed)
  process.env = variables
} else {
  if (!argv('--heroku')) {
    const env = dotevn.config({
      path: './.env'
    })
    const variables = dotenvParseVariables(env.parsed)
    process.env = {
      ...process.env,
      ...variables
    }
  }
}

export default process.env
