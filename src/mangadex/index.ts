import Mangadex, { AgentConstructor } from 'mangadex-api'
import Agent from 'mangadex-api/Agent'
import fs from 'fs'
import exitHook from 'async-exit-hook'

const {
  MANGADEX_USERNAME,
  MANGADEX_PASSWORD,
  MANGADEX_SESSION_PATH
} = process.env

export const client = new Mangadex({
  getCredentials: async () => {
    const session = await (Agent as AgentConstructor).login(
      MANGADEX_USERNAME,
      MANGADEX_PASSWORD,
      false
    )
    await Agent.saveSession(MANGADEX_SESSION_PATH, session)
    return session
  }
})

if (fs.existsSync(MANGADEX_SESSION_PATH)) {
  client.agent.loginWithSession(MANGADEX_SESSION_PATH).then((result) => {
    console.log('mangadex login result', result)
  })
} else {
  client.agent
    .login(MANGADEX_USERNAME, MANGADEX_PASSWORD, false)
    .then((result) => {
      console.log('mangadex login result', result)
    })
}

exitHook((callback) => {
  client.agent.saveSession('./mysession').then(() => callback())
})
