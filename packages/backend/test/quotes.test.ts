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
import { QuotesPostRequest } from "../src/types/mojaloop"

describe('Quote Request', () => {
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
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  test('charges 0 USD in fees', async () => {
    const quoteRequest: QuotesPostRequest = {
      amount: {
        amount: '100',
        currency: 'USD'
      },
      amountType: 'SEND',
      payee: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: '+829876544'
        }
      },
      payer: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: '+829876543'
        }
      },
      quoteId: '123456567',
      transactionId: '1111111',
      transactionType: {
        initiator: '',
        initiatorType: 'BUSINESS',
        scenario: ''
      }
    }
    Date.now = jest.fn().mockReturnValue(0)
    appContainer.mojaloopRequests.putQuotes = jest.fn()
    appContainer.ilpService.getQuoteResponseIlp = jest.fn().mockReturnValue({ condition: 'test-condition', ilpPacket: 'ilppacket' })

    const response = await Axios.post(`http://localhost:${appContainer.port}/quotes`, quoteRequest, { headers: { 'fspiop-source': 'mojawallet' } })

    expect(response.status).toBe(201)
    expect(appContainer.mojaloopRequests.putQuotes).toHaveBeenCalledWith('123456567', {
      condition: 'test-condition',
      ilpPacket: 'ilppacket',
      transferAmount: {
        amount: '100',
        currency: 'USD'
      },
      expiration: new Date(Date.now() + 120 * 1000).toISOString()
    }, 'mojawallet')
  })
})
