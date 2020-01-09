import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'
jest.mock('@mojaloop/sdk-standard-components')

describe('Users Service', function () {
  let appContainer: TestAppContainer
  const postParticipantsMock = jest.fn().mockImplementation(() => {
    return Promise.resolve()
  })

  beforeAll(async () => {
    appContainer = createTestApp()
    appContainer.mojaloopRequests.postParticipants = postParticipantsMock
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
  })

  afterEach(async () => {
    postParticipantsMock.mockClear()
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('store', function () {
    test('stores a user', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })
      expect(response.username).toEqual('+27844444444')
    })

    test('creating a user registers the number at the ALS', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })

      expect(postParticipantsMock.mock.calls.length).toBe(1)
      expect(postParticipantsMock.mock.calls[0][0].partyList).toStrictEqual([{
        partyIdentifier: '27844444444',
        partyIdType: 'MSISDN',
        fspId: 'mojawallet'
      }])
    })

    test('creating a user creates a signup session', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })

      const session = await appContainer.knex('signupSessions').where('id', response.signupSessionId).first()
      expect(response.id.toString()).toBe(session.userId)
    })

    test('throws invalid phonenumber', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        username: 'alice',
        password: 'test'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe('username')
        expect(data.errors[0].message).toBe('Invalid phone number entered')
        return error
      })
      expect(response.username).toBeUndefined()
    })

    test('hashes the password', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        return resp.data
      })
      expect(response.password).not.toEqual('test')
    })

    test('username is required', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        password: 'test'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe('username')
        expect(data.errors[0].message).toBe('"username" is required')
        return error
      })
      expect(response.username).toBeUndefined()
    })

    test('password is required', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        username: '+27844444444'
      }).then(resp => {
        return resp.data
      }).catch(error => {
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe('password')
        expect(data.errors[0].message).toBe('"password" is required')
        return error
      })
      expect(response.username).toBeUndefined()
    })

    test('userName must be unique', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/users`, {
        username: '+27844444444',
        password: 'test'
      }).then(resp => {
        expect(resp.status).toEqual(200)
        return resp.data
      })

      expect(response.username).toEqual('+27844444444')
      try {
        await axios.post(`http://localhost:${appContainer.port}/users`, {
          username: '+27844444444',
          password: 'test'
        })
      } catch (error) {
        const { data } = error.response
        expect(error.response.status).toEqual(422)
        expect(data.errors[0].field).toBe('username')
        expect(data.errors[0].message).toBe('Username already exists')
        return error
      }
    })
  })

  // TODO fix
  // describe('Edit', function () {
  //   test('Updates and hashes new password', async () => {
  //     const user = await axios.post(`http://localhost:${appContainer.port}/users`, {
  //       username: '+27844444444',
  //       password: 'oldPassword'
  //     }, {
  //       headers: {
  //         authorization: 'Bearer usersServiceToken'
  //       }
  //     }).then(resp => {
  //       expect(resp.status).toEqual(200)
  //       return resp.data
  //     })
  //     expect(user.username).toEqual('+27844444444')
  //
  //     await axios.patch(`http://localhost:${appContainer.port}/users`, {
  //       username: '+27844444444',
  //       password: 'newPassword'
  //     }, {
  //       headers: {
  //         authorization: 'Bearer usersServiceToken'
  //       }
  //     }).then(resp => {
  //       expect(resp.status).toEqual(200)
  //       return resp.data
  //     })
  //
  //     const updatedUser = await appContainer.userService.getById(user.id)
  //
  //     expect(updatedUser.password).not.toEqual('oldPassword')
  //     expect(updatedUser.password).not.toEqual('newPassword')
  //     expect(bcrypt.compare('newPassword', updatedUser.password)).toBeTruthy()
  //   })
  // })
})
