import Koa from 'koa'
import axios from 'axios'
import bcrypt from 'bcrypt'
import createLogger from 'pino'
import { Server } from 'http'
import { KnexAccountService } from '../src/services/accounts-service'
import { KnexTransactionService } from '../src/services/transactions-service'
import { KnexUserService } from '../src/services/user-service'
import { KnexTransactionRequestService } from '../src/services/transaction-request-service'
import { createApp } from '../src/app'
import { HydraApi, TokenInfo } from '../src/apis/hydra'
import Knex = require('knex')
import { KnexQuoteService } from '../src/services/quote-service'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import { KnexOtpService } from '../src/services/otp-service'
jest.mock('@mojaloop/sdk-standard-components');

describe('Users Service', function () {
  let server: Server
  let port: number
  let app: Koa
  let knex: Knex
  let accountsService: KnexAccountService
  let transactionsService: KnexTransactionService
  let transactionRequestService: KnexTransactionRequestService
  let quoteService: KnexQuoteService
  let userService: KnexUserService
  let otpService: KnexOtpService
  let hydraApi: HydraApi
  const mojaloopRequests = new MojaloopRequests({
    dfspId: 'mojawallet',
    jwsSign: false,
    jwsSigningKey: 'test',
    logger: console,
    peerEndpoint: '',
    tls: {outbound: {mutualTLS: {enabled: false}}}
  })
  const postParticipantsMock =  jest.fn().mockImplementation(() => {
    return Promise.resolve()
  })
  mojaloopRequests.postParticipants = postParticipantsMock

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      }
    })
    accountsService = new KnexAccountService(knex)
    transactionsService = new KnexTransactionService(knex)
    transactionRequestService = new KnexTransactionRequestService(knex)
    userService = new KnexUserService(knex)
    quoteService = new KnexQuoteService(knex)
    otpService = new KnexOtpService(knex)
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
      knex,
      accountsService,
      transactionsService,
      transactionRequestService,
      logger: createLogger(),
      hydraApi,
      userService,
      quoteService,
      mojaloopRequests,
      otpService
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
    postParticipantsMock.mockClear()
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

    test('creating a user registers the number at the ALS', async () => {

      const response = await axios.post(`http://localhost:${port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })

      expect(postParticipantsMock.mock.calls.length).toBe(1)
      expect(postParticipantsMock.mock.calls[0][0].partyList).toStrictEqual([{
        partyIdentifier: '+27844444444',
        partyIdType: 'MSISDN',
        fspId: 'mojawallet'
      }])
    })

    test('creating a user creates a signup session', async () => {

      const response = await axios.post(`http://localhost:${port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })

      const session = await knex('signupSessions').where('id', response.signupSessionId).first()
      expect(response.id.toString()).toBe(session.userId)
    })

    test('throws invalid phonenumber', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        username: 'alice',
        password: 'test'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe("username")
        expect(data.errors[0].message).toBe('Invalid phone number entered')
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

    test('username is required', async () => {
      const response = await axios.post(`http://localhost:${port}/users`, {
        password: 'test'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe("username")
        expect(data.errors[0].message).toBe('"username" is required')
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
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe("password")
        expect(data.errors[0].message).toBe('"password" is required')
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
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe("username")
        expect(data.errors[0].message).toBe('Username already exists')
        return error
      }
    })
  })

  describe('Edit', function () {
    test('Updates and hashes new password', async () => {
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

      await axios.patch(`http://localhost:${port}/users`, {
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

      const updatedUser = await userService.getById(user.id)

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
