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

describe('Faucet API Test', () => {
  let appContainer: TestAppContainer

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Add from faucet', () => {
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

    test('User can add money via fuacet', async () => {
      const mock = jest.fn()
      appContainer.pusherService.trigger = mock
      await axios.post(`http://localhost:${appContainer.port}/faucet`, {
        accountId: account.id
      }
      , {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        expect(resp.status).toBe(201)
        return resp.data
      })

      const acc = await appContainer.accountsService.get(account.id)
      expect(acc.balance.toString()).toBe('200000')
      expect(mock).toHaveBeenCalledWith({
        channel: `account-${account.id}`,
        name: 'transaction',
        data: {
          message: '200000'
        }
      })
    })

    test('User cant add a transaction for an account that\'s not theirs', async () => {
      const mock = jest.fn()
      appContainer.pusherService.trigger = mock
      const response = axios.post(`http://localhost:${appContainer.port}/transactions`, {
        accountId: account.id,
        amount: '100'
      }
      , {
        headers: {
          authorization: 'Bearer user2token'
        }
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 404'))
      expect(mock).toHaveBeenCalledTimes(0)
    })
  })
})
