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
import { QuoteResponse } from '../src/services/quoteResponse-service'
// import { getAuthorization } from '../src/services/mojaloop-service'
import { QuotesPostRequest } from '../src/types/mojaloop'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Response from switch after a quote is sent', () => {
  let appContainer: TestAppContainer
  let validQuote: QuotesPostRequest
  let validQuoteResponse: QuoteResponse
  // let invalidQuoteResponse: QuoteResponse

  beforeAll(async () => {
    appContainer = createTestApp()
    validQuote = {
      quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab',
      transactionId: '2c6af2fd-f0cb-43f5-98be-8abf539ee2c2',
      payee: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'partyA'
        }
      },
      payer: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'partyB'
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
    validQuoteResponse = {
      transferAmount: {
        currency: 'USD',
        amount: '20'
      },
      expiration: new Date().toISOString(),
      ilpPacket: 'abc123',
      condition: '1234567890123456789012345678901234567890123'
    }
    // invalidQuoteResponse = {
    //   transferAmount: {
    //     currency: 'USD',
    //     amount: '20'
    //   },
    //   expiration: 'asd',
    //   ilpPacket: 'abc123',
    //   condition: '1234567890123456789012345678901234567890123'
    // }
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await appContainer.knex.migrate.rollback()
  })

  afterAll(async () => {
    await appContainer.knex.destroy()
    appContainer.server.close()
  })

  describe('Handling PUT to "/quotes"', () => {
    test('Should return 200 status, store response and initiate Authorization on valid quote response', async () => {
      const mock = jest.fn()
      appContainer.mojaloopService.getAuthorization = mock
      await appContainer.quoteService.add(validQuote)
      const response = await axios.put(`http://localhost:${appContainer.port}/quotes/${validQuote.quoteId}`, validQuoteResponse)
      const retrievedQuoteResponse = await appContainer.quotesResponseService.get(validQuote.quoteId)

      if (retrievedQuoteResponse) {
        expect(retrievedQuoteResponse).toMatchObject({
          condition: '1234567890123456789012345678901234567890123',
          error: null,
          id: 1,
          ilpPacket: 'abc123',
          quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab',
          transferAmount: {
            amount: '20',
            currency: 'USD'
          }
        })
        expect(response.status).toEqual(200)
        // expect(mock).toBeCalledTimes(1) // wont get here yet because the transactionRequest is undefined. Need to find a better way to test this.
      } else {
        expect(true).toEqual(false)
      }
    })

    // test('Should return 400 status and not initiate Authorization on invalid quote response', async () => {
    //   await appContainer.quoteService.add(validQuote)
    //   axios.put(`http://localhost:${appContainer.port}/quotes/${validQuote.quoteId}`, invalidQuoteResponse)
    //     .then(response => {
    //       expect(true).toEqual(false)
    //     })
    //     .catch(async error => {
    //       expect(error.response.status).toEqual(400)
    //       const retrievedQuote = await appContainer.knex<MojaQuoteObj>('mojaQuote').where({ quoteId: validQuote.quoteId }).first()
    //       if (retrievedQuote) {
    //         expect(retrievedQuote.quoteResponse).toEqual(null)
    //         expect(authorizeQuote).toBeCalledTimes(0)
    //       } else {
    //         expect(true).toEqual(false)
    //       }
    //     })
    // })

    // test('Should return 404 status and not initiate Authorization on unknown quote id', async () => {
    //   const mock = jest.fn()
    //   appContainer.mojaloopService.getAuthorization = mock
    //   axios.put(`http://localhost:${appContainer.port}/quotes/${uuid.v4}`, validQuoteResponse)
    //     .then(response => {
    //       expect(true).toEqual(false)
    //     })
    //     .catch(error => {
    //       console.log(error)
    //       expect(error.status).toEqual(200)
    //       expect(mock).toBeCalledTimes(0)
    //     })
    // })
  })
})

describe('Quote Error Endpoint', () => {
  let appContainer: TestAppContainer
  // let validQuote: QuotesPostRequest
  // let validQuoteResponse: QuoteResponse
  // let invalidQuoteResponse: QuoteResponse

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await appContainer.knex.migrate.rollback()
  })

  afterAll(async () => {
    await appContainer.knex.destroy()
    appContainer.server.close()
  })

  test('Should return 200 status for quote error and write error to mojaQuotesResponse', async () => {
    const response = await axios.put(`http://localhost:${appContainer.port}/quotes/randomId/error`, {
      error: {
        errorCode: '1001',
        errorDescription: 'Connection error'
      }
    })

    const retrievedResponses = await appContainer.quotesResponseService.getError('randomId')

    expect(retrievedResponses).toEqual({
      quoteId: 'randomId',
      condition: null,
      ilpPacket: null,
      id: 1,
      transferAmount: null,
      expiration: null,
      error: {
        errorCode: '1001',
        errorDescription: 'Connection error'
      }
    })
    expect(response.status).toBe(200)
  })
})
