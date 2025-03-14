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

import { TestAppContainer, createTestApp } from "./utils/app"
import { MobileMoneyTransactionRequest, MobileMoneyTransaction } from "../src/types/mobile-money"
import Axios from "axios"
import { AuthorizationsIDPutResponse } from "../src/types/mojaloop"
import got from 'got/dist/source'

describe('GET /authorizations/:trxReqId', () => {
  let appContainer: TestAppContainer
  let transactionRequestId: string

  beforeAll(() => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    appContainer.pusherService.trigger = jest.fn()
    await appContainer.knex.migrate.latest()

    await appContainer.userService.store({
      username: '+27829876544',
      password: 'password'
    })
    await appContainer.accountsService.add({
      userId: '1',
      name: 'Jane',
      assetCode: 'USD',
      assetScale: 2,
      limit: 100000n
    })

    const transactionRequest: MobileMoneyTransactionRequest = {
      amount: '100',
      currency: '840',
      type: 'merchantpay',
      creditParty: [
        { key: 'msisdn', value: '+27829876543' },
        { key: 'accountId', value: '1' }
      ],
      debitParty: [
        { key: 'msisdn', value: '+27829876544' }
      ],
      oneTimeCode: 'abcde'
    }
    appContainer.mojaloopRequests.postTransactionRequests = jest.fn()
    const response = await Axios.post<MobileMoneyTransaction>(`http://localhost:${appContainer.port}/mm/transactions`, transactionRequest)
    transactionRequestId = response.data.transactionReference
    expect(appContainer.mojaloopRequests.postTransactionRequests).toHaveBeenCalled()
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  test('retrieves oneTimeCode from mobile money transaction related to transaction request and sends authorization response', async () => {
    appContainer.mojaloopRequests.putAuthorizations = jest.fn().mockResolvedValue({})
    got.put = jest.fn().mockResolvedValue({})
    Date.now = jest.fn().mockResolvedValue(0)
    const response = await Axios.get(`http://localhost:${appContainer.port}/authorizations/${transactionRequestId}?amount=100`, { headers: { 'fspiop-source': 'mojawallet' } })

    const mojaloopAuthResponse: AuthorizationsIDPutResponse = {
      responseType: 'ENTERED',
      authenticationInfo: {
        authentication: 'OTP',
        authenticationValue: 'abcde'
      }
    }
    expect(got.put).toHaveBeenCalledWith('https://transaction-request-service.mojaloop.app/authorizations/' + transactionRequestId, {
      headers: {
        'Content-Type': 'application/vnd.interoperability.authorizations+json;version=1.0',
        'Accept': 'application/vnd.interoperability.authorizations+json;version=1.0',
        'FSPIOP-Source': 'mojawallet',
        'FSPIOP-Destination': 'mojawallet',
        'Date': new Date().toUTCString()
      },
      json: mojaloopAuthResponse
    })
    expect(response.status).toBe(200)
  })
})
