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

import Knex from 'knex'
import Koa from 'koa'
import { Server } from 'http'
import { HydraApi } from '../src/apis/hydra'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'

describe('Consent', function () {
  let knex: Knex
  let accountsService: KnexAccountService
  let transactionsService: KnexTransactionService
  let app: Koa
  let server: Server
  let port: number
  let hydraApi: HydraApi

  describe('Mock test', () => {
    test('Nothing', () => {
      expect(1)
    })
  })

  // beforeAll(async () => {
  //   knex = Knex({
  //     client: 'sqlite3',
  //     connection: {
  //       filename: ':memory:'
  //     }
  //   })
  //   accountsService = new KnexAccountService(knex)
  //   transactionsService = new KnexTransactionService(knex)
  //   tokenService = new TokenService({
  //     clientId: process.env.OAUTH_CLIENT_ID || 'wallet-users-service',
  //     clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
  //     issuerUrl: process.env.OAUTH_ISSUER_URL || 'https://auth.rafiki.money',
  //     tokenRefreshTime: 0
  //   })
  //   hydraApi = {
  //     introspectToken: async (token) => {
  //       if (token === 'user1token') {
  //         return {
  //           sub: '1',
  //           active: true
  //         } as TokenInfo
  //       } else if (token === 'user2token') {
  //         return {
  //           sub: '2',
  //           active: true
  //         } as TokenInfo
  //       } else if (token === 'usersServiceToken') {
  //         return {
  //           sub: 'users-service',
  //           active: true
  //         } as TokenInfo
  //       } else {
  //         throw new Error('Getting Token failed')
  //       }
  //     }
  //   } as HydraApi

  //   app = createApp({
  //     accountsService,
  //     transactionsService,
  //     logger: createLogger(),
  //     tokenService,
  //     hydraApi
  //   })
  //   server = app.listen(0)
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //   // @ts-ignore
  //   port = server.address().port
  // })

  // beforeEach(async () => {
  //   await knex.migrate.latest()
  //   user = await User.query().insertAndFetch({ username: 'alice', password: 'test' })
  // })

  // afterEach(async () => {
  //   await knex.migrate.rollback()
  // })

  // afterAll(() => {
  //   server.close()
  //   knex.destroy()
  // })

  // describe('getAgreementUrlFromScopes', function () {
  //   test('returns id for valid mandates url', async () => {
  //     const scopes = ['offline', 'openid', 'mandates.aef-123']

  //     const url = getAgreementUrlFromScopes(scopes)

  //     expect(url).toEqual('http://localhost:3001/mandates/aef-123')
  //   })

  //   test('returns id for valid intents url', async () => {
  //     const scopes = ['offline', 'openid', 'intents.aef-123']

  //     const url = getAgreementUrlFromScopes(scopes)

  //     expect(url).toEqual('http://localhost:3001/intents/aef-123')
  //   })

  //   test('returns undefined if invalid agreements url', async () => {
  //     const scopes = ['offline', 'openid']

  //     const url = getAgreementUrlFromScopes(scopes)

  //     expect(url).toBeUndefined()
  //   })
  // })

  // describe('Get consent request', function () {
  //   test('returns agreementUrl, user, accounts, client and requested_scope if scopes contain intent', async () => {
  //     hydraApi.getConsentRequest = jest.fn().mockResolvedValue({ skip: false, subject: user.id.toString(), client: 'test-client', requested_scope: ['offline', 'openid', 'intents'] })

  //     const { status, data } = await axios.get(`http://localhost:${port}/consent?consent_challenge=test`)

  //     expect(status).toEqual(200)
  //     expect(hydraApi.getConsentRequest).toHaveBeenCalled()
  //     expect(data).toEqual({
  //       requestedScopes: ['offline', 'openid', 'intents'],
  //       client: 'test-client',
  //       user: user.id.toString()
  //     })
  //   })

  //   test('returns client, user and requested_scope if scope isn\'t for mandate/intent', async () => {
  //     hydraApi.getConsentRequest = jest.fn().mockResolvedValue({ skip: false, subject: user.id.toString(), client: 'test-client', requested_scope: ['offline', 'openid'] })
  //     accounts.getUserAccounts = jest.fn()

  //     const { status, data } = await axios.get(`http://localhost:${port}/consent?consent_challenge=test`)

  //     expect(status).toEqual(200)
  //     expect(hydraApi.getConsentRequest).toHaveBeenCalled()
  //     expect(accounts.getUserAccounts).not.toHaveBeenCalled()
  //     expect(data).toEqual({
  //       requestedScopes: ['offline', 'openid'],
  //       client: 'test-client',
  //       user: user.id.toString()
  //     })
  //   })
  // })

  // describe('Post consent', function () {
  //   test('gives consent if user accepts and returns redirectTo', async () => {
  //     hydraApi.getConsentRequest = jest.fn().mockResolvedValue({ requested_access_token_audience: 'test', subject: user.id.toString(), scopes: ['offline', 'openid'] })
  //     hydraApi.acceptConsentRequest = jest.fn().mockResolvedValue({ redirect_to: 'http://localhost:9010/callback' })

  //     const { status, data } = await axios.post(`http://localhost:${port}/consent?consent_challenge=testChallenge`, { accepts: true, scopes: ['offline', 'openid'] })

  //     expect(status).toEqual(200)
  //     expect(data).toEqual({ redirectTo: 'http://localhost:9010/callback' })
  //     expect(hydraApi.getConsentRequest).toHaveBeenCalled()
  //     expect(hydraApi.acceptConsentRequest).toHaveBeenCalledWith('testChallenge', {
  //       remember: true,
  //       remember_for: 0,
  //       grant_scope: ['offline', 'openid'],
  //       grant_access_token_audience: 'test',
  //       session: {
  //         access_token: {},
  //         id_token: {}
  //       }
  //     })
  //   })

  //   test('rejects consent if user denies, accepts posted as boolean', async () => {
  //     hydraApi.rejectConsentRequest = jest.fn().mockResolvedValue({
  //       redirect_to: 'http://localhost:9010/errorCallback'
  //     })

  //     const { status, data } = await axios.post(`http://localhost:${port}/consent?consent_challenge=testChallenge`, { accepts: false, scopes: ['offline', 'openid'] })

  //     expect(status).toEqual(200)
  //     expect(data).toEqual({ redirectTo: 'http://localhost:9010/errorCallback' })
  //     expect(hydraApi.rejectConsentRequest).toHaveBeenCalledWith('testChallenge', {
  //       error: 'access_denied',
  //       error_description: 'The resource owner denied the request'
  //     })
  //   })

  //   test('rejects consent if user denies, accepts posted as string', async () => {
  //     hydraApi.rejectConsentRequest = jest.fn().mockResolvedValue({
  //       redirect_to: 'http://localhost:9010/errorCallback'
  //     })

  //     const { status, data } = await axios.post(`http://localhost:${port}/consent?consent_challenge=testChallenge`, { accepts: 'false', scopes: ['offline', 'openid'] })

  //     expect(status).toEqual(200)
  //     expect(data).toEqual({ redirectTo: 'http://localhost:9010/errorCallback' })
  //     expect(hydraApi.rejectConsentRequest).toHaveBeenCalledWith('testChallenge', {
  //       error: 'access_denied',
  //       error_description: 'The resource owner denied the request'
  //     })
  //   })

  //   test('returns 401 if mandates scope is set and it doesn\'t match the logged in users payment pointer', async () => {
  //     // scenario: bob has logged in and is trying to give consent to a mandate that is scoped to alice's payment pointer
  //     const bob = await User.query().insertAndFetch({ username: 'bob', password: 'test' })
  //     const mandate = { id: 'aef-123', scope: '$rafiki.money/p/alice' }
  //     axios.get = jest.fn().mockResolvedValue({ data: mandate })
  //     hydraApi.getConsentRequest = jest.fn().mockResolvedValue({ requested_access_token_audience: 'test', subject: bob.id.toString(), scopes: ['offline', 'openid'] })

  //     try {
  //       await axios.post(`http://localhost:${port}/consent?consent_challenge=testChallenge`, { accepts: true, accountId: 1, scopes: ['offline', 'openid', 'mandates.aef-123'] })
  //     } catch (error) {
  //       expect(error.response.status).toEqual(401)
  //       expect(error.response.data).toEqual('You are not allowed to give consent to this agreement.')
  //       return
  //     }

  //     fail()
  //   })

  //   test('binds accountId, userId and scope to agreement if user gives consent for mandate', async () => {
  //     const updatedAgreement = { id: 'aef-123', userId: user.id.toString(), accountId: 1, scope: '$rafiki.money/p/alice' }
  //     hydraApi.getConsentRequest = jest.fn().mockResolvedValue({ requested_access_token_audience: 'test', subject: user.id.toString(), scopes: ['offline', 'openid'] })
  //     hydraApi.acceptConsentRequest = jest.fn().mockResolvedValue({ redirect_to: 'http://localhost:9010/callback' })
  //     axios.patch = jest.fn().mockResolvedValue({ data: updatedAgreement })

  //     const { status, data } = await axios.post(`http://localhost:${port}/consent?consent_challenge=testChallenge`, { accepts: true, accountId: 1, scopes: ['offline', 'openid', 'mandates.aef-123'] })

  //     expect(status).toEqual(200)
  //     expect(data).toEqual({ redirectTo: 'http://localhost:9010/callback' })
  //     expect(hydraApi.getConsentRequest).toHaveBeenCalled()
  //     expect(axios.patch).toHaveBeenCalledWith('http://localhost:3001/mandates/aef-123', { accountId: 1, userId: user.id.toString(), scope: '$rafiki.money/p/alice' })
  //     expect(hydraApi.acceptConsentRequest).toHaveBeenCalledWith('testChallenge', {
  //       remember: true,
  //       remember_for: 0,
  //       grant_scope: ['offline', 'openid', 'mandates.aef-123'],
  //       grant_access_token_audience: 'test',
  //       session: {
  //         access_token: {
  //           interledger: {
  //             agreement: updatedAgreement
  //           }
  //         },
  //         id_token: {
  //           interledger: {
  //             agreement: updatedAgreement
  //           }
  //         }
  //       }
  //     })
  //   })
  //   test('binds accountId and userId to agreement if user gives consent for intent', async () => {
  //     const updatedIntent = { id: 'aef-123', userId: user.id.toString(), accountId: 1 }
  //     hydraApi.getConsentRequest = jest.fn().mockResolvedValue({ requested_access_token_audience: 'test', subject: user.id.toString(), scopes: ['offline', 'openid'] })
  //     hydraApi.acceptConsentRequest = jest.fn().mockResolvedValue({ redirect_to: 'http://localhost:9010/callback' })
  //     axios.patch = jest.fn().mockResolvedValue({ data: updatedIntent })

  //     const { status, data } = await axios.post(`http://localhost:${port}/consent?consent_challenge=testChallenge`, { accepts: true, accountId: 1, scopes: ['offline', 'openid', 'intents.aef-123'] })

  //     expect(status).toEqual(200)
  //     expect(data).toEqual({ redirectTo: 'http://localhost:9010/callback' })
  //     expect(hydraApi.getConsentRequest).toHaveBeenCalled()
  //     expect(axios.patch).toHaveBeenCalledWith('http://localhost:3001/intents/aef-123', { accountId: 1, userId: user.id.toString() })
  //     expect(hydraApi.acceptConsentRequest).toHaveBeenCalledWith('testChallenge', {
  //       remember: true,
  //       remember_for: 0,
  //       grant_scope: ['offline', 'openid', 'intents.aef-123'],
  //       grant_access_token_audience: 'test',
  //       session: {
  //         access_token: {
  //           interledger: {
  //             agreement: updatedIntent
  //           }
  //         },
  //         id_token: {
  //           interledger: {
  //             agreement: updatedIntent
  //           }
  //         }
  //       }
  //     })
  //   })
  // })
})
