import Koa from 'koa'
import axios from 'axios'
import bcrypt from 'bcrypt'
import createLogger from 'pino'
import { Server } from 'http'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'
import { KnexUserService } from '../src/services/user-service'
import { createApp } from '../src/app'
import { HydraApi, TokenInfo } from '../src/apis/hydra'
import { TokenService } from '../src/services/token-service'
import Knex = require('knex')

describe('Users Service', function () {
  let server: Server
  let port: number
  let app: Koa
  let knex: Knex
  let accountsService: KnexAccountService
  let transactionsService: KnexTransactionService
  let userService: KnexUserService
  let hydraApi: HydraApi
  let tokenService: TokenService

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      }
    })
    accountsService = new KnexAccountService(knex)
    transactionsService = new KnexTransactionService(knex)
    userService = new KnexUserService(knex)
    tokenService = new TokenService({
      clientId: process.env.OAUTH_CLIENT_ID || 'wallet-users-service',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
      issuerUrl: process.env.OAUTH_ISSUER_URL || 'https://auth.rafiki.money',
      tokenRefreshTime: 0
    })
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
    const logger = createLogger()
    logger.level = 'trace'
    app = createApp({
      accountsService,
      transactionsService,
      logger,
      tokenService,
      hydraApi,
      userService
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

  describe('store', function () {
    test('stores a user', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })
      expect(response.username).toEqual('+27844444444')
    })

    test('throws invalid phonenumber', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        username: 'alice',
        password: 'test'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        expect(error.response.status).toEqual(400)
        expect(error.response.data).toEqual('Invalid phonenumber.')
        return error
      })
      expect(response.username).toBeUndefined()
    })

    test('hashes the password', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        return resp.data
      })
      expect(response.password).not.toEqual('test')
    })

    test('userName is required', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        password: 'test'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        expect(error.response.status).toEqual(400)
        expect(error.response.data).toEqual('"username" is required')
        return error
      })
      expect(response.username).toBeUndefined()
    })

    test('password is required', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        username: '+27844444444'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        expect(error.response.status).toEqual(400)
        expect(error.response.data).toEqual('"password" is required')
        return error
      })
      expect(response.username).toBeUndefined()
    })

    test('userName must be unique', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })
      expect(response.username).toEqual('+27844444444')
      try {
        await axios.post(`http://localhost:${port}/users`, {
          username: '+27844444444',
          password: 'test'
        })
      } catch (error) {
        expect(error.response.status).toEqual(400)
        expect(error.response.data).toEqual('A user with this username already exists.')
      }
    })
  })

  describe('Edit', function () {
    test('hashes the new password', async () => {
      const user = await axios.post(`http://localhost:${port}/users`, {
        username: '+27844444444',
        password: 'oldPassword'
      }, {
        headers: {
          authorization: 'Bearer usersServiceToken'
        }
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })
      expect(user.username).toEqual('+27844444444')
      const updatedUser = await axios.patch(`http://localhost:${port}/users`, {
        username: '+27844444444',
        password: 'newPassword'
      }, {
        headers: {
          authorization: 'Bearer usersServiceToken'
        }
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })
      expect(updatedUser.password).not.toEqual('oldPassword')
      expect(updatedUser.password).not.toEqual('newPassword')
      expect(bcrypt.compare('newPassword', updatedUser.password)).toBeTruthy()
    })
  })

  //   describe('Show', function () {
  //     test('returns user if there token is valid', async () => {
  //       const user = await User.query().insertAndFetch({ username: 'alice' })
  //       hydraApi.introspectToken = jest.fn().mockImplementation(async (token: string) => {
  //         if (token === 'validToken') {
  //           return {
  //             active: true,
  //             scope: 'offline openid',
  //             sub: user.id.toString(),
  //             token_type: 'access_token'
  //           }
  //         }

  //         return {
  //           active: false
  //         }
  //       })

  //       const { data } = await axios.get(`http://localhost:${port}/users/me`, { headers: { authorization: 'Bearer validToken' } })

  //       expect(data).toEqual(user.$formatJson())
  //       expect(data.password).toBeUndefined()
  //     })

  //     test('returns 401 if there is no token', async () => {
  //       hydraApi.introspectToken = jest.fn().mockImplementation(async (token: string) => {
  //         if (token === 'validToken') {
  //           return {
  //             active: true,
  //             scope: 'offline openid',
  //             sub: '1',
  //             token_type: 'access_token'
  //           }
  //         }

  //         return {
  //           active: false
  //         }
  //       })

  //       try {
  //         await axios.get(`http://localhost:${port}/users/me`)
  //       } catch (error) {
  //         expect(error.response.status).toEqual(401)
  //         return
  //       }

  //       fail()
  //     })

  //     test('returns 401 if token is invalid', async () => {
  //       hydraApi.introspectToken = jest.fn().mockImplementation(async (token: string) => {
  //         if (token === 'validToken') {
  //           return {
  //             active: true,
  //             scope: 'offline openid',
  //             sub: '1',
  //             token_type: 'access_token'
  //           }
  //         }

  //         return {
  //           active: false
  //         }
  //       })

  //       try {
  //         await axios.get(`http://localhost:${port}/users/me`, { headers: { authorization: 'Bearer invalidToken' } })
  //       } catch (error) {
  //         expect(error.response.status).toEqual(401)
  //         return
  //       }

//       fail()
//     })
//   })
})
