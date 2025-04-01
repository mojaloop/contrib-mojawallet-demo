/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Cairin Michie <cairin@coil.com>
- Donovan Changfoot <don@coil.com>
- Matthew de Haast <matt@coil.com>
- Talon Patterson <talon.patterson@coil.com>
*****/

import { KnexAccountService } from './services/accounts-service'
import { Logger } from 'pino'
import { KnexTransactionService } from './services/transactions-service'
import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import { MojaloopService } from './services/mojaloop-service'
import { KnexQuotesResponse } from './services/quoteResponse-service'
import { PusherService } from './services/pusher-service'
import { KnexMobileMoneyTransactionService } from './services/mobile-money-transactions'
import { IlpService } from './services/ilp-service'
import { KnexUserService } from './services/user-service'
import { KnexTransactionRequestService } from './services/transaction-request-service'
import { KnexQuoteService } from './services/quote-service'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import Knex from 'knex'
import { KnexOtpService } from './services/otp-service'
import { HydraApi } from './apis/hydra'
import { AccountsAppContext } from './index'
import { initialisePrivateRoutes, initialisePublicRoutes } from './routes'

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
  initialisePrivateRoutes(privateRouter, appConfig.hydraApi)
  initialisePublicRoutes(publicRouter)

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

  app.use(publicRouter.routes())
  app.use(privateRouter.routes())

  return app
}
