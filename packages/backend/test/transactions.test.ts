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

import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Transactions API Test', () => {
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

  describe('Create a transaction', () => {
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

    it('User cant add a transaction for an account', async () => {
      const response = axios.post(`http://localhost:${appContainer.port}/transactions`, {
        accountId: account.id,
        amount: '100'
      }
      , {
        headers: {
          authorization: 'Bearer user1token'
        }
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 404'))
    })
  })

  describe('Getting a transaction for account', () => {
    let account: any
    beforeEach(async () => {
      account = await appContainer.accountsService.add({
        assetCode: 'XML',
        assetScale: 2,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
      await appContainer.transactionsService.create(account.id, 100n)
    })

    it('User can get own accounts transactions', async () => {
      const response = await axios.get(`http://localhost:${appContainer.port}/transactions?accountId=${account.id}`
        , {
          headers: {
            authorization: 'Bearer user1token'
          }
        }).then(resp => {
        expect(resp.status).toBe(200)
        return resp.data
      })

      expect(response.length).toBe(1)
      expect(response[0].amount).toBe('100')
      expect(response[0].accountId).toBe(account.id.toString())
    })

    it('User cant get someone elses accounts transactions', async () => {
      const response = axios.get(`http://localhost:${appContainer.port}/transactions?accountId=${account.id}`
        , {
          headers: {
            authorization: 'Bearer user2token'
          }
        })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })
})
