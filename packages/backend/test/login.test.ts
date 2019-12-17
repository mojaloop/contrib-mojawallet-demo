import Koa from 'koa'
import Knex from 'knex'
import axios from 'axios'
import bcrypt from 'bcrypt'
import createLogger from 'pino'
import { Server } from 'http'
import { createApp } from '../src/app'
import { HydraApi, TokenInfo } from '../src/apis/hydra'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'
import { KnexUserService } from '../src/services/user-service'

describe('Login', function () {
  let server: Server
  let port: number
  let app: Koa
  let accountsService: KnexAccountService
  let usersService: KnexUserService
  let transactionsService: KnexTransactionService
  let hydraApi: HydraApi
  let knex: Knex

  describe('Mock test', () => {
    test('Nothing', () => {
      expect(1)
    })
  })

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      }
    })
    usersService = new KnexUserService(knex)
    accountsService = new KnexAccountService(knex)
    transactionsService = new KnexTransactionService(knex)
    hydraApi = {
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
        } else if (token === 'usersServiceToken') {
          return {
            sub: 'users-service',
            active: true
          } as TokenInfo
        } else {
          throw new Error('Getting Token failed')
        }
      }
    } as HydraApi

    app = createApp({
      accountsService,
      transactionsService,
      logger: createLogger(),
      hydraApi,
      userService: usersService,
      mojaloopRequests: {} as any,
      quoteService: {} as any,
      transactionRequestService: {} as any
    })
    server = app.listen(0)
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    port = server.address().port
  })

  beforeEach(async () => {
    await knex.migrate.latest()
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })

  afterAll(() => {
    server.close()
    knex.destroy()
  })

  describe('Get login request', function () {
    test('does not accept hydra login if user is not currently logged in', async () => {
      hydraApi.getLoginRequest = jest.fn().mockResolvedValue({ skip: false })
      hydraApi.acceptLoginRequest = jest.fn()

      const { status } = await axios.get(`http://localhost:${port}/login?login_challenge=test`)

      expect(status).toEqual(200)
      expect(hydraApi.getLoginRequest).toBeCalledWith('test')
      expect(hydraApi.acceptLoginRequest).not.toBeCalled()
    })

    test('accepts hydra login and returns a redirect url if user is logged in already', async () => {
      hydraApi.getLoginRequest = jest.fn().mockResolvedValue({
        skip: true,
        subject: '2'
      })
      hydraApi.acceptLoginRequest = jest.fn().mockResolvedValue({
        redirect_to: `http://localhost:${port}/redirect`
      })

      const { status, data } = await axios.get(`http://localhost:${port}/login?login_challenge=test`)

      expect(hydraApi.acceptLoginRequest).toHaveBeenCalledWith('test', { subject: '2', remember: true, remember_for: 604800 })
      expect(data.redirectTo).toEqual(`http://localhost:${port}/redirect`)
      expect(status).toEqual(200)
    })

    test('login_challenge query parameter is required', async () => {
      try {
        await axios.get(`http://localhost:${port}/login`)
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.errors[0].field).toBe("login_challenge")
        expect(data.errors[0].message).toBe('"login_challenge" is required')
        return
      }
      fail()
    })
  })

  describe('Post login', function () {

    test('No password gives an error', async () => {
      try {
        await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, {
          username: 'alice',
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe("Validation Failed")
        expect(data.errors[0].field).toBe("password")
        expect(data.errors[0].message).toBe('"password" is required')
        return
      }
      fail()
    })


    test('No login_challenge gives an error', async () => {
      try {
        await axios.post(`http://localhost:${port}/login`, {
          username: 'alice',
          password: 'alice'
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe("Validation Failed")
        expect(data.errors[0].field).toBe("login_challenge")
        expect(data.errors[0].message).toBe('"login_challenge" is required')
        return
      }
      fail()
    })

    test('No username gives an error', async () => {
      try {
        await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, {
          password: 'alice',
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe("Validation Failed")
        expect(data.errors[0].field).toBe("username")
        expect(data.errors[0].message).toBe('"username" is required')
        return
      }
      fail()
    })

    test('Username doesnt exist gives an error', async () => {
      try {
        await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, {
          username: 'matt',
          password: 'matt',
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe("Validation Failed")
        expect(data.errors[0].field).toBe("username")
        expect(data.errors[0].message).toBe('User does not exist')
        return
      }
      fail()
    })

    test('Incorrect password gives an error', async () => {
      await usersService.store({
        username: 'matt',
        password: 'notmypassword'
      })

      try {
        await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, {
          username: 'matt',
          password: 'matt',
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe("Validation Failed")
        expect(data.errors[0].field).toBe("password")
        expect(data.errors[0].message).toBe('Invalid password')
        return
      }
      fail()
    })

  })

    describe('valid user credentials', function () {
      test('accepts hydra login', async () => {
        hydraApi.acceptLoginRequest = jest.fn().mockResolvedValue({
          redirect_to: `http://localhost:${port}/redirect`
        })
        const user = await usersService.store({ username: 'alice', password: await bcrypt.hash('test', await bcrypt.genSalt()) })

        await axios.post(`http://localhost:${port}/login?login_challenge=testChallenge`, { username: 'alice', password: 'test' })

        expect(hydraApi.acceptLoginRequest).toHaveBeenCalledWith('testChallenge', { subject: user.id.toString(), remember: true,
          remember_for: 604800})
      })
    })
})
