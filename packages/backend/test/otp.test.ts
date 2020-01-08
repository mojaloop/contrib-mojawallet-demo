import { KnexAccountService } from "../src/services/accounts-service"
import { KnexTransactionService } from "../src/services/transactions-service"
import { KnexUserService } from "../src/services/user-service"
import { KnexTransactionRequestService } from "../src/services/transaction-request-service"
import { KnexQuoteService } from "../src/services/quote-service"
import { HydraApi, TokenInfo } from "../src/apis/hydra"
import Knex = require("knex")
import { MojaloopRequests } from "@mojaloop/sdk-standard-components"
import { createApp } from "../src/app"
import createLogger from 'pino'
import { Server } from 'http'
import Koa from 'koa'
import axios from "axios"
import { KnexOtpService } from "../src/services/otp-service"
import { accounts } from "../src/services/user-accounts-service"

describe('Tests for the otp endpoints', () => {
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
  let account: any
  const mojaloopRequests = new MojaloopRequests({
    dfspId: 'mojawallet',
    jwsSign: false,
    jwsSigningKey: 'test',
    logger: console,
    peerEndpoint: '',
    tls: {outbound: {mutualTLS: {enabled: false}}}
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
      otpService,
      mojaloopRequests
    })
    server = app.listen(0)
    // @ts-ignore
    port = server.address().port
  })

  beforeEach(async () => {
    await knex.migrate.latest()
    account = await accountsService.add({
      assetCode: 'XRP',
      assetScale: 6,
      limit: 0n,
      name: 'Test',
      userId: '1'
    })
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })

  afterAll(async () => {
    await knex.destroy()
    server.close()
  })

  describe('Tests for generating and storing an otp', () => {

    test('Should generate a 4 digit otp and store it', async () => {
      const response = await axios.post(
        `http://localhost:${port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )
      const retrievedOtp = await knex('mojaOtp').first()

      if (retrievedOtp) {
        expect(response.status).toEqual(200)
        expect(retrievedOtp.isUsed).toBeFalsy()
        expect(retrievedOtp.expiresAt).toBeGreaterThan(Math.floor((new Date(Date.now()).getTime()) / 1000))
        expect(retrievedOtp.otp).toMatch(new RegExp(/^[0-9]{4}$/))
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Should fail creating a second otp when an active one is present', async ()=> {
      const response1 = await axios.post(
        `http://localhost:${port}/otp`, 
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )
      const response2 = await axios.post(
        `http://localhost:${port}/otp`, 
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(409)
      })

    })

    test('Should fail if an invalid accountId is used', async () => {
      const response = await axios.post(
        `http://localhost:${port}/otp`, 
        { accountId: 11111 },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(400)
      })
    })

    test("Should fail if an invalid user is used", async () => {
      const response = await axios.post(
        `http://localhost:${port}/otp`, 
        { accountId: account.id },
        { headers: { authorization: 'Bearer user3token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(401)
      })
    })
    
  })

  describe('Tests for retrieving valid otps', () => {
    test('Should return 404 on no valid otp', async () => {
      const response = await axios.get(
        `http://localhost:${port}/otp`,
        { headers: { authorization: 'Bearer user2token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(404)
      })

    })

    test('Should return otp object on with valid otp', async () => {
      await axios.post(
        `http://localhost:${port}/otp`, 
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )

      const response = await axios.get(
        `http://localhost:${port}/otp`,
        { headers: { authorization: 'Bearer user1token' } }
      )

      if (response) {
        expect(response.status).toEqual(200)
        expect(response.data.isUsed).toBeFalsy()
        expect(response.data.expiresAt).toBeGreaterThan(Math.floor((new Date(Date.now()).getTime()) / 1000))
        expect(response.data.otp).toMatch(new RegExp(/^[0-9]{4}$/))
      } else {
        expect(true).toEqual(false)
      }

    })

    test('Invalid user should return 401', async () => {
      const response = await axios.get(
        `http://localhost:${port}/otp`,
        { headers: { authorization: 'Bearer user3token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(401)
      })

    })
  })
})