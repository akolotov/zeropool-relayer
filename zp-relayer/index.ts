import './env'
import express from 'express'
import router from './router'
import { logger } from './services/appLogger'
import { createLoggerMiddleware } from './services/loggerMiddleware'
import config from './config'
import { init } from './init'

const app = express()

app.use(createLoggerMiddleware('zp.log'))

app.use(router)

init().then(() => {
  const PORT = config.port
  app.listen(PORT, () => logger.info(`Started relayer on port ${PORT}`))
})
