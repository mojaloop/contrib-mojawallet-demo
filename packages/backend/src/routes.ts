import Router from '@koa/router'
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
import * as MobileMoneyTransactions from './controllers/mobile-money/transactions'
import * as P2P from './controllers/mobile-money/p2p'
import * as MobileMoneyAuthorisationCodes from './controllers/mobile-money/authorisation-code'
import { create as createOtp, fetch as fetchOtp, cancel as cancelOtp } from './controllers/otp'
import { createAuthMiddleware } from './middleware/auth'
import * as Authorizations from './controllers/authorizations'
import * as TransfersController from './controllers/transfers'
import { transfersResponse } from './controllers/transfersResponse'
import { transfersErrors } from './controllers/transfersErrors'
import { AccountsAppContext } from 'src'
import { HydraApi } from './apis/hydra'

export function initialisePublicRoutes (publicRouter: Router<any, AccountsAppContext>): void {
  publicRouter.get('/healthz', (ctx) => {
    ctx.status = 200
  })
  publicRouter.post('/users', storeUser)
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
  publicRouter.get('/parties/msisdn/:msisdnNumber', showParty)
  publicRouter.put('/parties/msisdn/:msisdnNumber', successPartiesCallback)
  publicRouter.put('/parties/msisdn/:msisdnNumber/error', errorPartiesCallback)
  publicRouter.put('/parties/BUSINESS/:businessId', successPartiesCallback)
  publicRouter.put('/participants/:id', successParticipantsCallback)
  publicRouter.put('/participants/:id/error', errorParticipantsCallback)
  publicRouter.put('/authorizations/:id/error', errorAuthorizationCallback)
  publicRouter.put('/authorizations/:id', Authorizations.authorizations)
  publicRouter.post('/transfers', TransfersController.create)
  publicRouter.put('/transfers/:id', transfersResponse)
  publicRouter.put('/transfers/:id/error', transfersErrors)

  publicRouter.post('/mm/p2p/create', P2P.create)
  publicRouter.post('/mm/p2p/getFees', P2P.getFees)
  publicRouter.post('/mm/p2p/makeTransfer', P2P.makeTransfer)

  publicRouter.post('/mm/transactions', MobileMoneyTransactions.create)
  publicRouter.get('/mm/transactions/:transactionReference', MobileMoneyTransactions.show)
  publicRouter.post('/mm/accounts/accountId/:accountId/authorisationCodes', MobileMoneyAuthorisationCodes.create)
  publicRouter.get('/authorizations/:transactionRequestId', Authorizations.show)
  publicRouter.put('/transactionRequests/:transactionRequestId', updateTransactionRequest)
}

export function initialisePrivateRoutes (privateRouter: Router<any, AccountsAppContext>, hydraApi: HydraApi): void {
  privateRouter.use(createAuthMiddleware(hydraApi))
  privateRouter.get('/accounts/:id', showAccount)
  privateRouter.get('/accounts', indexAccount)
  privateRouter.post('/accounts', createAccount)
  privateRouter.patch('/accounts/:id', updateAccount)
  privateRouter.delete('/accounts/:id', createAccount)
  privateRouter.get('/transactions', indexTransactions)
  privateRouter.post('/transactions', createTransaction)
  privateRouter.post('/faucet', createFaucet)
  privateRouter.patch('/users', updateUser)
  privateRouter.get('/users/me', showUser)
  privateRouter.post('/otp', createOtp)
  privateRouter.post('/otp/cancel', cancelOtp)
  privateRouter.get('/otp', fetchOtp)
}
