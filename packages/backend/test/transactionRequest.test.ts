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
import Knex = require('knex')
import cors from '@koa/cors'
import { KnexQuoteService } from '../src/services/quote-service'

jest.mock('../src/services/mojaResponseService', () => ({
  mojaResponseService: {
    putResponse: jest.fn(),
    putErrorResponse: jest.fn(),
    quoteResponse: jest.fn()
  }
}))
import { mojaResponseService } from '../src/services/mojaResponseService'


describe('Trnsaction Request Test', () => {
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
  let validRequest: TransactionRequest
  let invalidRequest: TransactionRequest

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
      accountsService,
      transactionsService,
      transactionRequestService,
      logger: createLogger(),
      hydraApi,
      userService,
      quoteService
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
  })

  describe('Handling a transaction request post', () => {
    test('Can store a valid transaction request and returns 200', async () => {
      const response = await axios.post(`http://localhost:${port}/transactionRequests`, validRequest)
      const storedRequest = await transactionRequestService.getByRequestId(validRequest.transactionRequestId)

      if (storedRequest) {
        expect(response.status).toEqual(200)
        expect(storedRequest.transactionRequestId).toEqual(validRequest.transactionRequestId)
        expect(mojaResponseService.putResponse).toHaveBeenCalledWith({
          transactionRequestState: 'RECEIVED'
        }, validRequest.transactionRequestId)
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
        expect(mojaResponseService.putErrorResponse).toHaveBeenCalledWith({
          errorInformation: {
            errorCode: '3100',
            errorDescription: 'Invalid transaction request',
            extensionList: []
          }
        }, invalidRequest.transactionRequestId)
      })
    })
  })

})
