/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the License) and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

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
