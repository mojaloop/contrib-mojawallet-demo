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

describe('Accounts API Test', () => {
  let appContainer: TestAppContainer

  beforeAll(() => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    appContainer.pusherService.trigger = jest.fn()
    await appContainer.knex.migrate.latest()
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Creating Account', () => {
    test('Can create an account if valid user', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/accounts`, {
        name: 'test'
      }, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      expect(response.userId).toBe('1')
      expect(response.name).toBe('test')
    })

    test('Cant create an account if invalid user', async () => {
      const response = axios.post(`http://localhost:${appContainer.port}/accounts`, {
        name: 'test'
      }, {
        headers: {
          authorization: 'Bearer user3token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 401'))
    })
  })

  describe('Updating Account', () => {
    let account: any
    beforeEach(async () => {
      account = await appContainer.accountsService.add({
        assetCode: 'XML',
        assetScale: 2,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
    })

    it('User can update their own account', async () => {
      await axios.patch(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        name: 'new test'
      }, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      const edittedAccount = await appContainer.accountsService.get(account.id)

      expect(edittedAccount.name).toBe('new test')
    })

    it('User cant update another users account', async () => {
      const response = axios.patch(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        name: 'new test'
      }, {
        headers: {
          authorization: 'Bearer user2token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })

  describe('Getting an Account', () => {
    let account: any
    beforeEach(async () => {
      account = await appContainer.accountsService.add({
        assetCode: 'XML',
        assetScale: 2,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
    })

    it('User can get their own account', async () => {
      const response = await axios.get(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      expect(response.name).toBe('Test')
    })

    it('User cant get someone elses account', async () => {
      const response = axios.get(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        headers: {
          authorization: 'Bearer user2token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })

  describe('Getting all user accounts', () => {
    beforeEach(async () => {
      await appContainer.accountsService.add({
        assetCode: 'XML',
        assetScale: 2,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
      await appContainer.accountsService.add({
        assetCode: 'XML',
        assetScale: 2,
        limit: 0n,
        name: 'Test 2',
        userId: '1'
      })
    })

    it('User can get their own accounts', async () => {
      const response = await axios.get(`http://localhost:${appContainer.port}/accounts?userId=1`, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      expect(response.length).toBe(2)
      response.forEach((account: any) => {
        expect(account.userId).toBe('1')
      })
    })

    it('User cant get someone elses account', async () => {
      const response = axios.get(`http://localhost:${appContainer.port}/accounts?userId=1`, {
        headers: {
          authorization: 'Bearer user2token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })
})
