import dotenv from 'dotenv'
import dotenvParseVariables from 'dotenv-parse-variables'
const env = dotenv.config({
  path: './.env'
})
process.env = dotenvParseVariables(env.parsed)
