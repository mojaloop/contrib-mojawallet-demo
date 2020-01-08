import Koa from 'koa'
import axios from 'axios'
import { createApp } from '../src/app'
import { Server } from 'http'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'
import { KnexUserService } from '../src/services/user-service'
import { KnexTransactionRequestService } from '../src/services/transaction-request-service'
import createLogger from 'pino'
import { HydraApi, TokenInfo } from '../src/apis/hydra'
import { KnexQuoteService } from '../src/services/quote-service'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import { KnexOtpService } from '../src/services/otp-service'
import Knex = require('knex')

describe('Parties Request Test', () => {
  let server: Server
  let port: number
  let app: Koa
  let knex: Knex
  let accountsService: KnexAccountService
  let transactionsService: KnexTransactionService
  let userService: KnexUserService
  let transactionRequestService: KnexTransactionRequestService
  let quoteService: KnexQuoteService
  let otpService: KnexOtpService
  let hydraApi: HydraApi
  const mojaloopRequests = new MojaloopRequests({
    dfspId: 'mojawallet',
    jwsSign: false,
    jwsSigningKey: 'test',
    logger: console,
    peerEndpoint: '',
    alsEndpoint: '',
    tls: { outbound: { mutualTLS: { enabled: false } } }
  })

  beforeAll(async () => {
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
    quoteService = new KnexQuoteService(knex)
    otpService = new KnexOtpService(knex)
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
      knex,
      accountsService,
      transactionsService,
      transactionRequestService,
      logger: createLogger(),
      hydraApi,
      userService,
      quoteService,
      mojaloopRequests,
      otpService
    })
    server = app.listen(0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    port = server.address().port
  })

  beforeEach(async () => {
    await knex.migrate.latest()
    await userService.store({
      username: '+27123456789',
      password: 'password'
    })
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })

  afterAll(() => {
    server.close()
    knex.destroy()
  })

  describe('Handling a parties get request', () => {
    test('Can retrieve a valid parties request and returns 200', async () => {
      const mock = jest.fn()
      mojaloopRequests.putParties = mock
      const response = await axios.get(`http://localhost:${port}/parties/msisdn/27123456789`, {
        headers: {
          'fspiop-source': 'MobileMoney',
          'fspiop-destination': 'mojawallet'
        }
      })
      expect(response.status).toEqual(200)
      expect(mock).toHaveBeenCalledWith('MSISDN', '27123456789', {
        party: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '27123456789',
            fspId: 'mojawallet'
          }
        }
      }, 'MobileMoney')
    })
  })
})
