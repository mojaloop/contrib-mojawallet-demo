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

import { Context } from 'koa'
import { KnexAccountService } from './services/accounts-service'
import { KnexTransactionService } from './services/transactions-service'
import { KnexUserService } from './services/user-service'
import { KnexTransactionRequestService } from './services/transaction-request-service'
import { Server } from 'http'
import { hydraApi } from './apis/hydra'
import createLogger, { Logger } from 'pino'
import { createApp } from './app'
import { KnexQuoteService } from './services/quote-service'
import { PusherService } from './services/pusher-service'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import { KnexOtpService } from './services/otp-service'
import { KnexMojaloopService, MojaloopService } from './services/mojaloop-service'
import { KnexQuotesResponse } from './services/quoteResponse-service'
import Knex = require('knex')
import { KnexMobileMoneyTransactionService } from './services/mobile-money-transactions'
import { IlpService } from './services/ilp-service'
const MojaloopSdk = require('@mojaloop/sdk-standard-components')
const logger = createLogger()
logger.level = process.env.LOG_LEVEL || 'info'

const PORT = process.env.PORT || 3001
const KNEX_CLIENT = process.env.KNEX_CLIENT || 'sqlite3'
const DFSP_ID = process.env.DFSP_ID || 'mojawallet'
const ALS_ENDPOINT = process.env.ALS_ENDPOINT || 'account-lookup-service.mojaloop.app'
const QUOTES_ENDPOINT = process.env.QUOTES_ENDPOINT || 'quoting-service.mojaloop.app'
const TRANSFERS_ENDPOINT = process.env.TRANSFERS_ENDPOINT || 'ml-api-adapter.mojaloop.app'
const TRANSACTION_REQUEST_ENDPOINT = process.env.TRANSACTION_REQUEST_ENDPOINT || 'transaction-request-service.mojaloop.app'
const ILP_SECRET = process.env.ILP_SECRET || 'secret'

export interface AccountsAppContext extends Context {
  accounts: KnexAccountService;
  transactions: KnexTransactionService;
  transactionRequests: KnexTransactionRequestService;
  quotes: KnexQuoteService;
  pusher: PusherService;
  quotesResponse: KnexQuotesResponse;
  otp: KnexOtpService;
  users: KnexUserService;
  logger: Logger;
  mojaloopRequests: MojaloopRequests
  mojaloopService: MojaloopService
  mobileMoneyTransactions: KnexMobileMoneyTransactionService
  ilpService: IlpService
  knex: Knex
}

const knex = KNEX_CLIENT === 'mysql' ? Knex({
  client: 'mysql',
  connection: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  }
}) : Knex({
  client: 'sqlite3',
  connection: {
    filename: ':memory:'
  }
})

const accountsService = new KnexAccountService(knex)
const transactionsService = new KnexTransactionService(knex)
const userService = new KnexUserService(knex)
const transactionRequestService = new KnexTransactionRequestService(knex)
const quoteService = new KnexQuoteService(knex)
const pusherService = new PusherService({
  appId: '932692',
  key: '55dfaae15da48fdc5bec',
  secret: '498c54335cf92dec4541',
  cluster: 'eu'
})
const quotesResponseService = new KnexQuotesResponse(knex)
const otpService = new KnexOtpService(knex)
const mojaloopRequests = new MojaloopRequests({
  dfspId: DFSP_ID,
  jwsSign: false,
  jwsSigningKey: 'dummykey',
  logger: console,
  peerEndpoint: ALS_ENDPOINT,
  quotesEndpoint: QUOTES_ENDPOINT,
  alsEndpoint: ALS_ENDPOINT,
  transfersEndpoint: TRANSFERS_ENDPOINT,
  transactionRequestsEndpoint: TRANSACTION_REQUEST_ENDPOINT,
  tls: { outbound: { mutualTLS: { enabled: true }, creds: {} } },
  // TODO: Hack until fix is pushed
  wso2Auth: {
    getToken: () => null
  }
})
const mobileMoneyTransactions = new KnexMobileMoneyTransactionService(knex)

const mojaloopService = new KnexMojaloopService(knex, mojaloopRequests, otpService)
const ilpService = new MojaloopSdk.Ilp({ secret: ILP_SECRET, logger: console })

const app = createApp({
  knex,
  accountsService,
  transactionsService,
  logger,
  hydraApi,
  userService,
  transactionRequestService,
  quoteService,
  pusherService,
  quotesResponseService,
  otpService,
  mojaloopRequests,
  mojaloopService,
  mobileMoneyTransactions,
  ilpService
})

let server: Server
export const gracefulShutdown = async (): Promise<void> => {
  logger.info('shutting down.')
  if (server) {
    return new Promise((resolve, reject): void => {
      server.close((err?: Error) => {
        if (err) {
          reject(err)
          return
        }
        knex.destroy()
        resolve()
      })
    })
  }
}

export const start = async (): Promise<void> => {
  let shuttingDown = false
  process.on('SIGINT', async (): Promise<void> => {
    try {
      if (shuttingDown) {
        logger.warn('received second SIGINT during graceful shutdown, exiting forcefully.')
        process.exit(1)
      }

      shuttingDown = true

      // Graceful shutdown
      await gracefulShutdown()
      logger.info('completed graceful shutdown.')
    } catch (err) {
      const errInfo = (err && typeof err === 'object' && err.stack) ? err.stack : err
      logger.error('error while shutting down. error=%s', errInfo)
      process.exit(1)
    }
  })

  // Do migrations
  await knex.migrate.latest()

  server = app.listen(PORT)
  logger.info(`Listening on ${PORT}`)
}

// If this script is run directly, start the server
if (!module.parent) {
  start().catch(e => {
    const errInfo = (e && typeof e === 'object' && e.stack) ? e.stack : e
    logger.error(errInfo)
  })
}
