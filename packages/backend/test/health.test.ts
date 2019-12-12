import Koa from 'koa'
import got from 'got'
import { createApp } from '../src/app'
import { Server } from 'http'
import createLogger from 'pino'

describe('Health API Test', () => {
  let server: Server
  let port: number
  let app: Koa

  beforeAll(async () => {
    app = createApp({
      logger: createLogger(),
      accountsService: {} as any,
      hydraApi: {} as any,
      transactionsService: {} as any,
      userService: {} as any,
      transactionRequestService: {} as any,
      quoteService: {} as any,
      mojaloopRequests: {} as any
    })
    server = app.listen(0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    port = server.address().port
  })

  afterAll(() => {
    server.close()
  })

  it('Can hit health endpoint', async () => {
    const response = await got.get({
      url: `http://localhost:${port}/healthz`
    })

    expect(response.statusCode).toBe(200)
  })
})
