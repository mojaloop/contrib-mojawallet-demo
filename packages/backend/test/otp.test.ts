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

describe('Tests for the otp endpoints', () => {
  let appContainer: TestAppContainer
  let account: any

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
    account = await appContainer.accountsService.add({
      assetCode: 'XML',
      assetScale: 2,
      limit: 0n,
      name: 'Test',
      userId: '1'
    })
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Tests for generating and storing an otp', () => {
    test('Should generate a 4 digit otp and store it', async () => {
      const response = await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )
      const retrievedOtp = await appContainer.knex('mojaOtp').first()

      if (retrievedOtp) {
        expect(response.status).toEqual(200)
        expect(retrievedOtp.isUsed).toBeFalsy()
        expect(retrievedOtp.expiresAt).toBeGreaterThan(Math.floor((new Date(Date.now()).getTime()) / 1000))
        expect(retrievedOtp.otp).toMatch(new RegExp(/^[0-9]{4}$/))
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Should fail creating a second otp when an active one is present', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(409)
      })
    })

    test('Should fail if an invalid accountId is used', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: 11111 },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(400)
      })
    })

    test('Should fail if an invalid user is used', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user3token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(401)
      })
    })
  })

  describe('Tests for retrieving valid otps', () => {
    test('Should return 404 on no valid otp', async () => {
      await axios.get(
        `http://localhost:${appContainer.port}/otp`,
        { headers: { authorization: 'Bearer user2token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(404)
      })
    })

    test('Should return otp object on with valid otp', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )

      const response = await axios.get(
        `http://localhost:${appContainer.port}/otp`,
        { headers: { authorization: 'Bearer user1token' } }
      )

      if (response) {
        expect(response.status).toEqual(200)
        expect(response.data.isUsed).toBeFalsy()
        expect(response.data.expiresAt).toBeGreaterThan(Math.floor((new Date(Date.now()).getTime()) / 1000))
        expect(response.data.otp).toMatch(new RegExp(/^[0-9]{4}$/))
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Invalid user should return 401', async () => {
      await axios.get(
        `http://localhost:${appContainer.port}/otp`,
        { headers: { authorization: 'Bearer user3token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(401)
      })
    })
  })

  describe('Tests for cancelling an otp', () => {
    test('Should set an otp\'s expiration date to now to "cancel" it', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )

      const response = await axios.post(
        `http://localhost:${appContainer.port}/otp/cancel`,
        {},
        { headers: { authorization: 'Bearer user1token' } }
      )
      expect(response.status).toEqual(200)

      const updatedEntry = await appContainer.knex('mojaOtp').where({ accountId: account.id }).first()

      if (updatedEntry) {
        expect(updatedEntry.expiresAt).toBeLessThanOrEqual(Date.now() / 1000)
      } else {
        expect(true).toEqual(false)
      }      
    })

    test('Should prevent cancellation of an otp without a valid token', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp/cancel`,
        {},
        { headers: { authorization: 'Bearer user3token' } }
      )
      .then(response => {
        expect(response).toBeUndefined()
      })
      .catch(error => {
        expect(error.response.status).toEqual(401)
      })
    })

    test('Should return a 404 on no active otp\'s present', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp/cancel`,
        {},
        { headers: { authorization: 'Bearer user1token' } }
      )
      .then(response => {
        expect(response).toBeUndefined()
      })
      .catch(error => {
        expect(error.response.status).toEqual(404)
      })
    })
  })
})
