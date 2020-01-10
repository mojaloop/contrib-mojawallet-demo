import Koa from 'koa'
import Router from '@koa/router'
import { Server } from 'http'
import cors from '@koa/cors'
import { mojaResponseService } from '../../src/services/mojaResponseService'

describe('Moja response services test', () => {
  let switchServer: Server

  beforeAll(async () => {
    const testSwitch = new Koa()
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
    }, ms))

    test('Should respond to a successful transaction request', async (done) => {
      mojaResponseService
        .putResponse(
          {
            transactionRequestState: 'RECEIVED'
          },
          'transactionRequest-id here',
          'mojaloop'
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
          'transactionRequest-id here',
          'mojaloop'
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
  })
})
