import Koa from 'koa'
import axios from 'axios'
import { createApp } from '../src/app'
import { Server } from 'http'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'
import { KnexUserService } from '../src/services/user-service'
import { KnexTransactionRequestService, TransactionRequest } from '../src/services/transaction-request-service'
import { KnexQuoteService, Quote, MojaQuoteObj } from '../src/services/quote-service'
import { QuoteResponse } from '../src/services/quoteResponse-service'
import { HydraApi, TokenInfo } from '../src/apis/hydra'
import createLogger from 'pino'
import { authorizeQuote } from '../src/services/authorization-service'
import Knex = require('knex')
import uuid from 'uuid'
import { MojaloopRequests } from "@mojaloop/sdk-standard-components"

jest.mock('../src/services/authorization-service', () => ({
  authorizeQuote: jest.fn()
}))

describe('Response from switch after a quote is sent', () => {
  let server: Server
  let port: number
  let app: Koa
  let knex: Knex
  let accountsService: KnexAccountService
  let transactionsService: KnexTransactionService
  let userService: KnexUserService
  let transactionRequestService: KnexTransactionRequestService
  let quoteService: KnexQuoteService
  let hydraApi: HydraApi
  let validQuote: Quote
  let validQuoteResponse: QuoteResponse
  let invalidQuoteResponse: QuoteResponse
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
      mojaloopRequests
    })
    server = app.listen(0)
    // @ts-ignore
    port = server.address().port

    validQuote = {
      quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab',
      transactionId: '2c6af2fd-f0cb-43f5-98be-8abf539ee2c2',
      payee: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'partyA'
        }
      },
      payer: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'partyB'
        }
      },
      amountType: 'RECEIVE',
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
    validQuoteResponse = {
      transferAmount:{
        currency: 'USD',
        amount: '20'
      },
      expiration: new Date().toISOString(),
      ilpPacket: 'abc123',
      condition: '1234567890123456789012345678901234567890123'
    }
    invalidQuoteResponse = {
      transferAmount:{
        currency: 'USD',
        amount: '20'
      },
      expiration: 'asd',
      ilpPacket: 'abc123',
      condition: '1234567890123456789012345678901234567890123'
    }
  })

  beforeEach(async () => {
    await knex.migrate.latest()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await knex.migrate.rollback()
  })

  afterAll(async () => {
    await knex.destroy()
    server.close()
  })

  describe('Handling PUT to "/quotes"', () => {
    test('Should return 200 status, store response and initiate Authorization on valid quote response', async () => {

      quoteService.add(validQuote)
      const response = await axios.put(`http://localhost:${port}/quotes/${validQuote.quoteId}`, validQuoteResponse)
      const retrievedQuote = await knex<MojaQuoteObj>('mojaQuote').where({ quoteId: validQuote.quoteId }).first()

      if (retrievedQuote) {
        expect(retrievedQuote.quoteResponse).toEqual(JSON.stringify(validQuoteResponse))
        expect(response.status).toEqual(200)
        expect(authorizeQuote).toBeCalledTimes(1)
      } else {
        expect(true).toEqual(false)
      }

    })

    test('Should return 400 status and not initiate Authorization on invalid quote response', async () => {

      quoteService.add(validQuote)
      axios.put(`http://localhost:${port}/quotes/${validQuote.quoteId}`, invalidQuoteResponse)
      .then(response => {
        expect(true).toEqual(false)
      })
      .catch(async error => {
        expect(error.response.status).toEqual(400)
        const retrievedQuote = await knex<MojaQuoteObj>('mojaQuote').where({ quoteId: validQuote.quoteId }).first()
        if (retrievedQuote) {
          expect(retrievedQuote.quoteResponse).toEqual(null)
          expect(authorizeQuote).toBeCalledTimes(0)
        } else {
          expect(true).toEqual(false)
        }
      })

    })

    test('Should return 404 status and not initiate Authorization on unknown quote id', async () => {

      axios.put(`http://localhost:${port}/quotes/${uuid.v4}`, validQuoteResponse)
      .then(response => {
        expect(true).toEqual(false)
      })
      .catch(error => {
        expect(error.response.status).toEqual(404)
        expect(authorizeQuote).toBeCalledTimes(0)
      })

    })
  })
})
