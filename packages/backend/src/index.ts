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
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import { KnexOtpService } from './services/otp-service'
import { KnexMojaloopService, MojaloopService } from './services/mojaloop-service'
import Knex = require('knex')
const logger = createLogger()
logger.level = process.env.LOG_LEVEL || 'info'

const PORT = process.env.PORT || 3001
const KNEX_CLIENT = process.env.KNEX_CLIENT || 'sqlite3'
const DFSP_ID = process.env.DFSP_ID || 'mojawallet'
const ALS_ENDPOINT = process.env.ALS_ENDPOINT || 'account-lookup-service.iso-demo.openafrica.network'
const QUOTES_ENDPOINT = process.env.ALS_ENDPOINT || 'quoting-service.iso-demo.openafrica.network'

export interface AccountsAppContext extends Context {
  accounts: KnexAccountService;
  transactions: KnexTransactionService;
  transactionRequests: KnexTransactionRequestService;
  quotes: KnexQuoteService;
  otp: KnexOtpService;
  users: KnexUserService;
  logger: Logger;
  mojaloopRequests: MojaloopRequests
  mojaloopService: MojaloopService
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
const otpService = new KnexOtpService(knex)
const mojaloopRequests = new MojaloopRequests({
  dfspId: DFSP_ID,
  jwsSign: false,
  jwsSigningKey: 'dummykey',
  logger: console,
  peerEndpoint: ALS_ENDPOINT,
  quotesEndpoint: QUOTES_ENDPOINT,
  alsEndpoint: ALS_ENDPOINT,
  tls: { outbound: { mutualTLS: { enabled: false } } },
  // TODO: Hack until fix is pushed
  wso2Auth: {
    getToken: () => null
  }
})

const mojaloopService = new KnexMojaloopService(knex, mojaloopRequests, otpService)

const app = createApp({
  knex,
  accountsService,
  transactionsService,
  logger,
  hydraApi,
  userService,
  transactionRequestService,
  quoteService,
  otpService,
  mojaloopRequests,
  mojaloopService
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
