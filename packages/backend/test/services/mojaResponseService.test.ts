import Koa from 'koa'
import Router from '@koa/router'
import { Server } from 'http'
import cors from '@koa/cors'
import { mojaResponseService } from '../../src/services/mojaResponseService'
import { QuoteTools } from '../../src/services/quote-service'

describe('Moja response services test', () => {
  let switchServer: Server

  beforeAll(async () => {
    let testSwitch = new Koa()
    testSwitch.use(cors())
    const router = new Router()
    router.put('/transactionRequests/:id', ctx => {
      ctx.status = 200
    })
    router.put('/transactionRequests/:id/error', ctx => {
      ctx.status = 200
    })
    router.post('/quotes', ctx => {
      ctx.status = 200
    })
    testSwitch.use(router.routes())
    switchServer = testSwitch.listen(8008)
  })

  beforeEach(async () => {})

  afterEach(async () => {})

  afterAll(async () => {
    switchServer.close()
  })

  describe('Sending responses to endpoints', () => {
  const sleep = (ms: number, ftDone: any) => new Promise((resolve) => setTimeout(() => {
    ftDone()
    resolve()
  } , ms))
    
    test('Should respond to a successful transaction request', async (done) => {
      mojaResponseService
        .putResponse(
          {
            transactionRequestState: 'RECEIVED'
          },
          'transactionRequest-id here'
        )
        .then(response => {
          expect(response.statusCode).toEqual(200)
        })
        .catch(() => {
          expect(true).toEqual(false)
        })
      // setTimeout(() => {
      //   done()
      // }, 1000);
      await sleep(300, done)
    })

    test('Should respond to a failed transaction request', async (done) => {
      mojaResponseService
        .putErrorResponse(
          {
            errorInformation: {
              errorCode: '3100',
              errorDescription: 'Invalid transaction request',
              extensionList: []
            }
          },
          'transactionRequest-id here'
        )
        .then(response => {
          expect(response.statusCode).toEqual(200)
        })
        .catch(() => {
          expect(true).toEqual(false)
        })
        // setTimeout(() => {
        //   done()
        // }, 1000);
      await sleep(300, done)
    })

    test('Should submit a quote', async (done) => {
      const quoteTools = new QuoteTools({
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
          scenario: 'DEPOSIT',
          initiator: 'PAYER',
          initiatorType: 'CONSUMER'
        }
      })
      mojaResponseService
        .quoteResponse(quoteTools.getQuote())
        .then(response => {
          expect(response.statusCode).toEqual(200)
        })
        .catch(() => {
          expect(true).toEqual(false)
        })
        // setTimeout(() => {
        //   done()
        // }, 1000);
      await sleep(300, done)
    })
  })
})
