/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the License) and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

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
