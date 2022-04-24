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

import { Server } from 'http'
import Koa from 'koa'
import { KnexAccountService } from '../../src/services/accounts-service'
import { KnexMojaloopService, MojaloopService } from '../../src/services/mojaloop-service'
import { KnexTransactionService } from '../../src/services/transactions-service'
import { KnexUserService } from '../../src/services/user-service'
import { KnexTransactionRequestService } from '../../src/services/transaction-request-service'
import { KnexQuoteService } from '../../src/services/quote-service'
import { HydraApi, TokenInfo } from '../../src/apis/hydra'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import Knex from 'knex'
import { createApp } from '../../src/app'
import createLogger from 'pino'
import { KnexOtpService } from '../../src/services/otp-service'
import { KnexQuotesResponse } from '../../src/services/quoteResponse-service'
import { PusherService } from '../../src/services/pusher-service'
import { KnexMobileMoneyTransactionService } from '../../src/services/mobile-money-transactions'
import { IlpService } from '../../src/services/ilp-service'
import DefferedJobService from 'src/services/deffered-job-service'
const MojaloopSdk = require('@mojaloop/sdk-standard-components')

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
  quotesResponseService: KnexQuotesResponse
  pusherService: PusherService
  hydraApi: HydraApi
  mojaloopRequests: MojaloopRequests
  otpService: KnexOtpService
  mobileMoneyTransactions: KnexMobileMoneyTransactionService
  ilpService: IlpService,
  defferedJobService: DefferedJobService

}

export const createTestApp = (): TestAppContainer => {
  const knex = Knex({
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true
  })
  const mojaloopRequests = new MojaloopRequests({
    dfspId: 'mojawallet',
    jwsSign: false,
    jwsSigningKey: 'test',
    logger: console,
    peerEndpoint: '',
    tls: { outbound: { mutualTLS: { enabled: false }, creds: {} } }
  })
  const accountsService = new KnexAccountService(knex)
  const transactionsService = new KnexTransactionService(knex)
  const userService = new KnexUserService(knex)
  const transactionRequestService = new KnexTransactionRequestService(knex)
  const pusherService = new PusherService({
    appId: '932692',
    key: '55dfaae15da48fdc5bec',
    secret: '498c54335cf92dec4541',
    cluster: 'eu'
  })
  const quoteService = new KnexQuoteService(knex)
  const quotesResponseService = new KnexQuotesResponse(knex)
  const otpService = new KnexOtpService(knex)
  const mojaloopService = new KnexMojaloopService(knex, mojaloopRequests, otpService)
  const mobileMoneyTransactions = new KnexMobileMoneyTransactionService(knex)
  const ilpService = new MojaloopSdk.Ilp({ secret: 'secret', logger: console })
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
  const defferedJobService = new DefferedJobService()

  const app = createApp({
    knex,
    accountsService,
    transactionsService,
    transactionRequestService,
    logger: createLogger(),
    hydraApi,
    userService,
    quoteService,
    pusherService,
    quotesResponseService,
    mojaloopRequests,
    mojaloopService,
    otpService,
    mobileMoneyTransactions,
    ilpService,
    defferedJobService
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
    pusherService,
    quotesResponseService,
    hydraApi,
    mojaloopRequests,
    otpService,
    mobileMoneyTransactions,
    ilpService,
    defferedJobService
  }
}
