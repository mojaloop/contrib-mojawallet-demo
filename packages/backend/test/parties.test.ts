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

describe('Parties Request Test', () => {
  let appContainer: TestAppContainer

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
    await appContainer.userService.store({
      username: '+27123456789',
      password: 'password'
    })
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Handling a parties get request', () => {
    test('Can retrieve a valid parties request and returns 200', async () => {
      const mock = jest.fn()
      appContainer.mojaloopRequests.putParties = mock
      const response = await axios.get(`http://localhost:${appContainer.port}/parties/msisdn/27123456789`, {
        headers: {
          'fspiop-source': 'MobileMoney',
          'fspiop-destination': 'mojawallet'
        }
      })
      expect(response.status).toEqual(202)
      expect(mock).toHaveBeenCalledWith('MSISDN', '27123456789', null, {
        party: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '27123456789',
            fspId: 'mojawallet'
          }
        }
      }, 'MobileMoney')
    })
  })

  describe('Handling a parties put response', () => {
    test('Handling a success response', async () => {
      const response = await axios.put(`http://localhost:${appContainer.port}/parties/msisdn/27123456789`)
      expect(response.status).toEqual(200)
    })

    test('Handling a failed response', async () => {
      const response = await axios.put(`http://localhost:${appContainer.port}/parties/msisdn/27123456789/error`)
      expect(response.status).toEqual(200)
    })
  })
})
