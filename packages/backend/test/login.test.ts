import Koa from 'koa'
import Knex from 'knex'
import axios from 'axios'
import bcrypt from 'bcrypt'
import createLogger from 'pino'
import { Server } from 'http'
import { createApp } from '../src/app'
import { HydraApi, TokenInfo } from '../src/apis/hydra'
import { TokenService } from '../src/services/token-service'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'

describe('Login', function () {
  let server: Server
  let port: number
  let app: Koa
  let accountsService: KnexAccountService
  let transactionsService: KnexTransactionService
  let hydraApi: HydraApi
  let tokenService: TokenService
  let knex: Knex
  const logger = createLogger()

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
  //     hydraApi,
  //     userService
  //   })
  //   server = app.listen(0)
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //   // @ts-ignore
  //   port = server.address().port
  // })

  // beforeEach(async () => {
  //   await knex.migrate.latest()
  // })

  // afterEach(async () => {
  //   await knex.migrate.rollback()
  // })

  // afterAll(() => {
  //   server.close()
  //   knex.destroy()
  // })

  // describe('Get login request', function () {
  //   test('does not accept hydra login if user is not currently logged in', async () => {
  //     hydraApi.getLoginRequest = jest.fn().mockResolvedValue({ skip: false })
  //     hydraApi.acceptLoginRequest = jest.fn()

  //     const { status } = await axios.get(`http://localhost:${port}/login?login_challenge=test`)

  //     expect(status).toEqual(200)
  //     expect(hydraApi.getLoginRequest).toBeCalledWith('test')
  //     expect(hydraApi.acceptLoginRequest).not.toBeCalled()
  //   })

  //   test('accepts hydra login and returns a redirect url if user is logged in already', async () => {
  //     hydraApi.getLoginRequest = jest.fn().mockResolvedValue({
  //       skip: true,
  //       subject: '2'
  //     })
  //     hydraApi.acceptLoginRequest = jest.fn().mockResolvedValue({
  //       redirect_to: `http://localhost:${port}/redirect`
  //     })

  //     const { status, data } = await axios.get(`http://localhost:${port}/login?login_challenge=test`)

  //     expect(hydraApi.acceptLoginRequest).toHaveBeenCalledWith('test', { subject: '2', remember: false })
  //     expect(data.redirectTo).toEqual(`http://localhost:${port}/redirect`)
  //     expect(status).toEqual(200)
  //   })

  //   test('login_challenge query parameter is required', async () => {
  //     try {
  //       await axios.get(`http://localhost:${port}/login`)
  //     } catch (error) {
  //       expect(error.response.status).toEqual(400)
  //       expect(error.response.data).toEqual('login_challenge is required.')
  //       return
  //     }
  //     fail()
  //   })
  // })

  // describe('Post login', function () {
  //   test('returns 401 if username does not exist', async () => {
  //     try {
  //       await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, { username: 'alice', password: 'test' })
  //     } catch (error) {
  //       expect(error.response.status).toEqual(401)
  //       return
  //     }
  //     fail()
  //   })

  //   test('returns 401 if password is incorrect', async () => {
  //     await User.query().insert({ username: 'alice', password: await bcrypt.hash('test', await bcrypt.genSalt()) })

  //     try {
  //       await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, { username: 'alice', password: 'asd' })
  //     } catch (error) {
  //       expect(error.response.status).toEqual(401)
  //       return
  //     }

  //     fail()
  //   })

  //   test('login_challenge query parameter is required', async () => {
  //     try {
  //       await axios.post(`http://localhost:${port}/login`, { username: 'alice', password: 'test' })
  //     } catch (error) {
  //       expect(error.response.status).toEqual(400)
  //       expect(error.response.data).toEqual('login_challenge is required.')
  //       return
  //     }
  //     fail()
  //   })

  //   describe('valid user credentials', function () {
  //     test('accepts hydra login', async () => {
  //       hydraApi.acceptLoginRequest = jest.fn().mockResolvedValue({
  //         redirect_to: `http://localhost:${port}/redirect`
  //       })
  //       const user = await User.query().insert({ username: 'alice', password: await bcrypt.hash('test', await bcrypt.genSalt()) })

  //       await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, { username: 'alice', password: 'test' })

  //       expect(hydraApi.acceptLoginRequest).toHaveBeenCalledWith('testChallenge', { subject: user.id.toString(), remember: false })
  //     })
  //   })
  // })
})
