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
import { TestAppContainer, createTestApp } from './utils/app'
import { OtpTools } from '../src/services/otp-service'
import { QuotesPostRequest } from '../src/types/mojaloop'
import { QuoteResponseTool } from '../src/services/quoteResponse-service'

describe('Authorization Response', () => {
  let appContainer: TestAppContainer
  let user: any
  let account: any
  let otp: any
  let quote: QuotesPostRequest

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
    user = await appContainer.userService.store({
      password: '123',
      username: '+271337'
    })
    account = await appContainer.accountsService.add({
      assetCode: 'XML',
      assetScale: 2,
      limit: -3000n,
      name: 'Awesome Account',
      userId: user.id
    })
    await appContainer.transactionRequestService.create({
      transactionRequestId: 'ca919568-e559-42a8-b763-1be22179decc',
      payee: {
        partyIdInfo: {
          partyIdType: 'DEVICE',
          partyIdentifier: 'atmId'
        }
      },
      payer: {
        partyIdType: 'MSISDN',
        partyIdentifier: '271337'
      },
      amount: {
        currency: 'XML',
        amount: '20'
      },
      transactionType: {
        scenario: 'DEPOSIT',
        initiator: 'PAYER',
        initiatorType: 'CONSUMER'
      }
    }, user.id)
    const transactionId = await appContainer.transactionRequestService.getByRequestId('ca919568-e559-42a8-b763-1be22179decc')
    const otpObj = new OtpTools(user.id, account.id)
    await appContainer.otpService.add(otpObj.getOtp())
    otp = otpObj.getOtp().otp
    if (transactionId) {
      quote = {
        quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab',
        transactionId: transactionId.transactionId,
        payee: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: 'party1'
          }
        },
        payer: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: 'party2'
          }
        },
        amountType: 'RECEIVE',
        amount: {
          currency: 'USD',
          amount: '20'
        },
        transactionType: {
          scenario: 'DEPOSIT',
          initiator: 'PAYER',
          initiatorType: 'CONSUMER'
        }
      }
    }
    await appContainer.quoteService.add(quote)
    const validQuoteResponse = {
      transferAmount: {
        currency: 'USD',
        amount: '20'
      },
      expiration: new Date().toISOString(),
      ilpPacket: 'abc123',
      condition: '1234567890123456789012345678901234567890123'
    }
    // await appContainer.quotesResponseService.store(validQuoteResponse)
    const quoteResponseTools = new QuoteResponseTool(validQuoteResponse, quote.quoteId)
    await appContainer.quotesResponseService.store(quoteResponseTools.getQuoteResponseProps())
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await appContainer.knex.migrate.rollback()
  })

  afterAll(async () => {
    await appContainer.knex.destroy()
    appContainer.server.close()
  })

  describe('Handling PUT to "/authorizations/{ID}"', () => {
    test('Can handle getting an authorization PUT request', async () => {
      const response = await axios.put(`http://localhost:${appContainer.port}/authorizations/${123}`, {
        authenticationInfo: {
          authentication: 'OTP',
          authenticationValue: otp
        },
        responseType: 'ENTERED'
      })

      expect(response.status).toBe(200)
    })

    test('If authorization is valid transfer is initiated', async () => {
      appContainer.mojaloopService.initiateTransfer = jest.fn()
      appContainer.pusherService.trigger = jest.fn()

      const response = await axios.put(`http://localhost:${appContainer.port}/authorizations/ca919568-e559-42a8-b763-1be22179decc`, {
        authenticationInfo: {
          authentication: 'OTP',
          authenticationValue: otp
        },
        responseType: 'ENTERED'
      })

      expect(appContainer.mojaloopService.initiateTransfer).toBeCalledTimes(1)
      expect(appContainer.pusherService.trigger).toBeCalledTimes(1)
      expect(response.status).toBe(200)
    })

    test('If authorization is invalid dont initiate transfer', async () => {
      appContainer.mojaloopService.initiateTransfer = jest.fn()
      appContainer.pusherService.trigger = jest.fn()

      const response = await axios.put(`http://localhost:${appContainer.port}/authorizations/ca919568-e559-42a8-b763-1be22179decc`, {
        authenticationInfo: {
          authentication: 'OTP',
          authenticationValue: '1234'
        },
        responseType: 'ENTERED'
      })

      expect(appContainer.mojaloopService.initiateTransfer).toBeCalledTimes(0)
      expect(appContainer.pusherService.trigger).toBeCalledTimes(0)
      expect(response.status).toBe(200)
    })
  })
})
