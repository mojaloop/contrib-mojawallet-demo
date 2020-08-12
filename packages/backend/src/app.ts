import { KnexAccountService } from './services/accounts-service'
import { Logger } from 'pino'
import { KnexTransactionService } from './services/transactions-service'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { create as createFaucet } from './controllers/faucet'
import { create as createTransaction, index as indexTransactions } from './controllers/transactions'
import { create as createAccount, update as updateAccount, show as showAccount, index as indexAccount } from './controllers/accounts'
import { show as showUser, store as storeUser, update as updateUser } from './controllers/user'
import { show as showLogin, store as storeLogin } from './controllers/login'
import { store as storeLogout } from './controllers/logout'
import { show as showParty, errorCallback as errorPartiesCallback, successCallback as successPartiesCallback } from './controllers/parties'
import { errorCallback as errorParticipantsCallback, successCallback as successParticipantsCallback } from './controllers/participants'
import { index as refreshALS } from './controllers/refreshALS'
import { errorCallback as errorAuthorizationCallback } from './controllers/authorizationsError'
import { create as createTransactionRequest, update as updateTransactionRequest } from './controllers/transactionRequest'
import { show as showConsent, store as storeConsent } from './controllers/consent'
import { quoteResponse } from './controllers/quoteResponse'
import * as QuotesController from './controllers/quotes'
import { store as quoteErrorStore } from './controllers/quoteErrors'
import { create as createOtp, fetch as fetchOtp, cancel as cancelOtp } from './controllers/otp'
import { AccountsAppContext } from './index'
import { HydraApi } from './apis/hydra'
import { createAuthMiddleware } from './middleware/auth'
import cors from '@koa/cors'
import { KnexUserService } from './services/user-service'
import { KnexTransactionRequestService } from './services/transaction-request-service'
import { KnexQuoteService } from './services/quote-service'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import Knex from 'knex'
import { KnexOtpService } from './services/otp-service'
import * as Authorizations from './controllers/authorizations'
import * as TransfersController from './controllers/transfers'
import { transfersResponse } from './controllers/transfersResponse'
import { transfersErrors } from './controllers/transfersErrors'
import { MojaloopService } from './services/mojaloop-service'
import { KnexQuotesResponse } from './services/quoteResponse-service'
import { PusherService } from './services/pusher-service'
import * as MobileMoneyTransactions from './controllers/mobile-money/transactions'
import * as MobileMoneyAuthorisationCodes from './controllers/mobile-money/authorisation-code'
import { KnexMobileMoneyTransactionService } from './services/mobile-money-transactions'
import { IlpService } from './services/ilp-service'

export type AppConfig = {
  logger: Logger;
  accountsService: KnexAccountService;
  transactionsService: KnexTransactionService;
  transactionRequestService: KnexTransactionRequestService;
  pusherService: PusherService;
  quoteService: KnexQuoteService;
  quotesResponseService: KnexQuotesResponse;
  hydraApi: HydraApi;
  userService: KnexUserService;
  otpService: KnexOtpService;
  mojaloopRequests: MojaloopRequests;
  mojaloopService: MojaloopService;
  mobileMoneyTransactions: KnexMobileMoneyTransactionService;
  ilpService: IlpService;
  knex: Knex
}

export function createApp (appConfig: AppConfig): Koa<any, AccountsAppContext> {
  const app = new Koa<any, AccountsAppContext>()
  const privateRouter = new Router<any, AccountsAppContext>()
  const publicRouter = new Router<any, AccountsAppContext>()

  app.use(cors())
  app.use(bodyParser({
    detectJSON: () => true
  }))
  app.use(async (ctx, next) => {
    ctx.knex = appConfig.knex
    ctx.accounts = appConfig.accountsService
    ctx.transactions = appConfig.transactionsService
    ctx.logger = appConfig.logger
    ctx.users = appConfig.userService
    ctx.transactionRequests = appConfig.transactionRequestService
    ctx.quotes = appConfig.quoteService
    ctx.pusher = appConfig.pusherService
    ctx.quotesResponse = appConfig.quotesResponseService
    ctx.otp = appConfig.otpService
    ctx.hydraApi = appConfig.hydraApi
    ctx.mojaloopRequests = appConfig.mojaloopRequests
    ctx.mojaloopService = appConfig.mojaloopService
    ctx.mobileMoneyTransactions = appConfig.mobileMoneyTransactions
    ctx.ilpService = appConfig.ilpService
    await next()
  })

  app.use(async (ctx, next) => {
    ctx.logger.info(ctx.request.method + ' ' + ctx.request.url, { body: ctx.request.body, header: ctx.request.header })
    await next()
  })

  // Health Endpoint
  publicRouter.get('/healthz', (ctx) => {
    ctx.status = 200
  })

  privateRouter.use(createAuthMiddleware(appConfig.hydraApi))
  privateRouter.get('/accounts/:id', showAccount)
  privateRouter.get('/accounts', indexAccount)
  privateRouter.post('/accounts', createAccount)
  privateRouter.patch('/accounts/:id', updateAccount)
  privateRouter.delete('/accounts/:id', createAccount)

  privateRouter.get('/transactions', indexTransactions)
  privateRouter.post('/transactions', createTransaction)

  privateRouter.post('/faucet', createFaucet)

  publicRouter.post('/users', storeUser)
  privateRouter.patch('/users', updateUser)
  privateRouter.get('/users/me', showUser)

  publicRouter.get('/login', showLogin)
  publicRouter.post('/login', storeLogin)

  publicRouter.post('/logout', storeLogout)

  publicRouter.get('/consent', showConsent)
  publicRouter.post('/consent', storeConsent)

  publicRouter.get('/refreshALS', refreshALS)

  publicRouter.post('/transactionRequests', createTransactionRequest)

  publicRouter.post('/quotes', QuotesController.create)
  publicRouter.put('/quotes/:id', quoteResponse)
  publicRouter.put('/quotes/:id/error', quoteErrorStore)

  privateRouter.post('/otp', createOtp)
  privateRouter.post('/otp/cancel', cancelOtp)
  privateRouter.get('/otp', fetchOtp)

  publicRouter.get('/parties/msisdn/:msisdnNumber', showParty)

  publicRouter.put('/parties/msisdn/:msisdnNumber', successPartiesCallback)
  publicRouter.put('/parties/msisdn/:msisdnNumber/error', errorPartiesCallback)

  publicRouter.put('/participants/:id', successParticipantsCallback)
  publicRouter.put('/participants/:id/error', errorParticipantsCallback)

  publicRouter.put('/authorizations/:id/error', errorAuthorizationCallback)

  // privateRouter.post('/oauth2/clients', createValidationOauth2, storeOauth2)
  publicRouter.put('/authorizations/:id', Authorizations.authorizations)

  publicRouter.post('/transfers', TransfersController.create)
  publicRouter.put('/transfers/:id', transfersResponse)
  publicRouter.put('/transfers/:id/error', transfersErrors)

  publicRouter.post('/mm/transactions', MobileMoneyTransactions.create)
  publicRouter.get('/mm/transactions/:transactionReference', MobileMoneyTransactions.show)
  publicRouter.post('/mm/accounts/accountId/:accountId/authorisationCodes', MobileMoneyAuthorisationCodes.create)

  publicRouter.get('/authorizations/:transactionRequestId', Authorizations.show)
  publicRouter.put('/transactionRequests/:transactionRequestId', updateTransactionRequest)

  app.use(publicRouter.routes())
  app.use(privateRouter.routes())

  return app
}
