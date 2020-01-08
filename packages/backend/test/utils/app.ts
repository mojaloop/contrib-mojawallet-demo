import { Server } from "http"
import Koa from 'koa'
import { KnexAccountService } from '../../src/services/accounts-service'
import { KnexMojaloopService, MojaloopService } from '../../src/services/mojaloop-service'
import { KnexTransactionService } from '../../src/services/transactions-service'
import { KnexUserService } from '../../src/services/user-service'
import { KnexTransactionRequestService } from '../../src/services/transaction-request-service'
import { KnexQuoteService } from '../../src/services/quote-service'
import { HydraApi, TokenInfo } from '../../src/apis/hydra'
import { MojaloopRequests } from "@mojaloop/sdk-standard-components"
import Knex from "knex"
import { createApp } from '../../src/app'
import createLogger from 'pino'
import { KnexOtpService } from '../../src/services/otp-service'

export type TestAppContainer = {
  server: Server,
  port: number,
  app: Koa,
  knex: Knex,
  accountsService: KnexAccountService
  mojaloopService: MojaloopService
  transactionsService: KnexTransactionService
  userService: KnexUserService
  transactionRequestService: KnexTransactionRequestService
  quoteService: KnexQuoteService
  hydraApi: HydraApi
  mojaloopRequests: MojaloopRequests
  otpService: KnexOtpService
}


export const createTestApp = (): TestAppContainer => {
  const knex = Knex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    }
  })
  const mojaloopRequests = new MojaloopRequests({
    dfspId: 'mojawallet',
    jwsSign: false,
    jwsSigningKey: 'test',
    logger: console,
    peerEndpoint: '',
    tls: {outbound: {mutualTLS: {enabled: false}}}
  })
  const accountsService = new KnexAccountService(knex)
  const transactionsService = new KnexTransactionService(knex)
  const userService = new KnexUserService(knex)
  const transactionRequestService = new KnexTransactionRequestService(knex)
  const quoteService = new KnexQuoteService(knex)
  const otpService = new KnexOtpService(knex)
  const mojaloopService = new KnexMojaloopService(knex, mojaloopRequests, otpService)
  const hydraApi = {
    introspectToken: async (token) => {
      if (token === 'user1token') {
        return {
          sub: '1',
          active: true
        } as TokenInfo
      } else if (token === 'user2token') {
        return {
          sub: '2',
          active: true
        } as TokenInfo
      } else if (token === 'user3token') {
        return {
          sub: '3',
          active: false
        } as TokenInfo
      } else {
        throw new Error('Getting Token failed')
      }
    }
  } as HydraApi

  const app = createApp({
    knex,
    accountsService,
    transactionsService,
    transactionRequestService,
    logger: createLogger(),
    hydraApi,
    userService,
    quoteService,
    mojaloopRequests,
    mojaloopService,
    otpService
  })
  const server = app.listen(0)
  // @ts-ignore
  const port = server.address().port

  return {
    server,
    port,
    app,
    knex,
    accountsService,
    mojaloopService,
    transactionsService,
    userService,
    transactionRequestService,
    quoteService,
    hydraApi,
    mojaloopRequests,
    otpService
  }
}
