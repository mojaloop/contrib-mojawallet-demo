import Koa from 'koa'
import { Logger } from 'pino'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'

export type AppConfig = {
  logger: Logger
}

export function createApp (appConfig: AppConfig): Koa {
  const app = new Koa()
  const privateRouter = new Router()
  const publicRouter = new Router()

  app.use(cors())
  app.use(bodyParser())

  app.use(async (ctx, next) => {
    ctx.logger = appConfig.logger
    await next()
  })

  // Health Endpoint
  publicRouter.get('/healthz', (ctx) => {
    ctx.status = 200
  })

  app.use(publicRouter.routes())
  app.use(privateRouter.routes())

  return app
}
