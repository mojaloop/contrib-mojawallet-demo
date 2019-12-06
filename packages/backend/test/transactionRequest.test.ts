import Koa from 'koa'
import Router from '@koa/router'
import axios from 'axios'
import { createApp } from '../src/app'
import { Server } from 'http'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'
import { KnexUserService } from '../src/services/user-service'
import { KnexTransactionRequestService, TransactionRequest } from '../src/services/transaction-request-service'
import createLogger from 'pino'
import { HydraApi, TokenInfo } from '../src/apis/hydra'
import { TokenService } from '../src/services/token-service'
import Knex = require('knex')
import cors from '@koa/cors'

describe('Accounts API Test', () => {
  let server: Server
  let switchServer: Server
  let port: number
  let app: Koa
  let knex: Knex
  let accountsService: KnexAccountService
  let transactionsService: KnexTransactionService
  let userService: KnexUserService
  let transactionRequestService: KnexTransactionRequestService
  let hydraApi: HydraApi
  let tokenService: TokenService
  let validRequest: TransactionRequest
  let invalidRequest: TransactionRequest

  beforeAll(async () => {
    let testSwitch = new Koa()
    testSwitch.use(cors())
    const router = new Router()
    router.put('/transactionRequests/:id', ctx => {ctx.status = 200})
    router.put('/transactionRequests/:id/error', ctx => {ctx.status = 200})
    testSwitch.use(router.routes())
    switchServer = testSwitch.listen(8008)

    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      }
    })
    accountsService = new KnexAccountService(knex)
    transactionsService = new KnexTransactionService(knex)
    userService = new KnexUserService(knex)
    transactionRequestService = new KnexTransactionRequestService(knex)
    tokenService = new TokenService({
      clientId: process.env.OAUTH_CLIENT_ID || 'wallet-users-service',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
      issuerUrl: process.env.OAUTH_ISSUER_URL || 'https://auth.rafiki.money',
      tokenRefreshTime: 0
    })
    hydraApi = {
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

    app = createApp({
      accountsService,
      transactionsService,
      transactionRequestService,
      logger: createLogger(),
      hydraApi,
      tokenService,
      userService
    })
    server = app.listen(0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    port = server.address().port

    validRequest = {
      transactionRequestId: 'ca919568-e559-42a8-b763-1be22179decc',
      payee: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'party1'
        }
      },
      payer: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'party2'
        }
      },
      amount: {
        currency: 'USD',
        amount: '20'
      },
      transactionType: {
        scenario: 'DEPOSIT' ,
        initiator: 'PAYER',
        initiatorType: 'CONSUMER'
      }
    }
    invalidRequest = {
      transactionRequestId: 'ca919568-e559-42a8763-1be22179decc',
      payee: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'party1'
        }
      },
      payer: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'party2'
        }
      },
      amount: {
        currency: 'USD',
        amount: '20'
      },
      transactionType: {
        scenario: 'DEPOSIT' ,
        initiator: 'PAYER',
        initiatorType: 'CONSUMER'
      }
    }
  })

  beforeEach(async () => {
    await knex.migrate.latest()
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })

  afterAll(() => {
    server.close()
    knex.destroy()
    switchServer.close()
  })

  describe('Handling a transaction request post', () => {
    test('Can store a valid transaction request and returns 200', async () => {
      const response = await axios.post(`http://localhost:${port}/transactionRequests`, validRequest)
      const storedRequest = await transactionRequestService.getByRequestId(validRequest.transactionRequestId)

      if (storedRequest) {
        expect(response.status).toEqual(200)
        expect(storedRequest.transactionRequestId).toEqual(validRequest.transactionRequestId)
      } else {
        expect(storedRequest).toBeDefined()
      }
    })

    test('An invalid transaction request does not store data and returns 400', async () => {
      await axios.post(`http://localhost:${port}/transactionRequests`, invalidRequest)
      .then( resp => {
        expect(true).toEqual(false)
      })
      .catch( async error => {
        const storedRequest = await transactionRequestService.getByRequestId(invalidRequest.transactionRequestId)
        expect(storedRequest).toBeUndefined()
        expect(error.response.status).toEqual(400)
      })
    })
  })

})
