import Koa from 'koa'
import got from 'got'
import { createApp } from '../src/app'
import { Server } from 'http'
import createLogger from 'pino'
import { TokenService } from '../src/services/token-service'

describe('Health API Test', () => {
  let server: Server
  let port: number
  let app: Koa
  let tokenService: TokenService

  beforeAll(async () => {
    tokenService = new TokenService({
      clientId: process.env.OAUTH_CLIENT_ID || 'wallet-users-service',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
      issuerUrl: process.env.OAUTH_ISSUER_URL || 'https://auth.rafiki.money',
      tokenRefreshTime: 0
    })

    app = createApp({
      logger: createLogger(),
      accountsService: {} as any,
      hydraApi: {} as any,
      transactionsService: {} as any,
      tokenService,
      userService: {} as any,
      transactionRequestService: {} as any
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
