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

import { QuoteResponse, QuoteResponseTool, KnexQuotesResponse, QuoteResponseProps, ErrorQuoteResponseTool, ErrorQuoteResponse, ErrorQuoteResponseProps } from '../../src/services/quoteResponse-service'
import { KnexQuoteService } from '../../src/services/quote-service'
import { QuotesPostRequest } from '../../src/types/mojaloop'
import { authorizeQuote } from '../../src/services/authorization-service'
import Knex = require('knex')

jest.mock('../../src/services/authorization-service', () => ({
  authorizeQuote: jest.fn()
}))

describe('Quote response service tests', () => {
  let knex: Knex
  let knexQuoteService: KnexQuoteService
  let knexQuotesResponse: KnexQuotesResponse
  let validQuote: QuotesPostRequest
  let validQuoteResponse: QuoteResponse
  let validErrorQuoteResponse: ErrorQuoteResponse
  let quoteResponseProps: QuoteResponseProps
  let errorQuoteResponseProps: ErrorQuoteResponseProps

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      }
    })

    knexQuoteService = new KnexQuoteService(knex)
    knexQuotesResponse = new KnexQuotesResponse(knex)

    validQuote = {
      quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab',
      transactionId: '2c6af2fd-f0cb-43f5-98be-8abf539ee2c2',
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

    validQuoteResponse = {
      transferAmount: {
        currency: 'USD',
        amount: '20'
      },
      expiration: 'Wed, 15 Jan 2020 12:35:47 GMT',
      ilpPacket: 'abc123',
      condition: '1234567890123456789012345678901234567890123'
    }

    validErrorQuoteResponse = {
      error: {
        errorCode: '1001',
        errorDescription: 'Connection error'
      }
    }

    errorQuoteResponseProps = {
      quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab',
      error: {
        errorCode: '1001',
        errorDescription: 'Connection error'
      }
    }

    quoteResponseProps = {
      quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab',
      transferAmount: {
        currency: 'USD',
        amount: '20'
      },
      expiration: '2020-01-15 12:35:47',
      ilpPacket: 'abc123',
      condition: '1234567890123456789012345678901234567890123'
    }
  })

  beforeEach(async () => {
    await knex.migrate.latest()
  })

  afterEach(async () => {
    await knex.migrate.rollback()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    knex.destroy()
  })

  describe('Testing of quote response tools', () => {
    // test('Should sucessfully construct tool object with valid quote response', async () => {
    //   await knexQuoteService.add(validQuote)
    //   let serializedResponse: string
    //   try {
    //     const quoteResponseTool = new QuoteResponseTool(validQuoteResponse, validQuote.quoteId)
    //     quoteResponseTool.initAuthorization()
    //     serializedResponse = await quoteResponseTool.getSerializedResponse()
    //     expect(serializedResponse).toEqual(JSON.stringify(validQuoteResponse))
    //   } catch (error) {
    //     console.log(error)
    //     expect(true).toEqual(false)
    //   }
    //   expect(authorizeQuote).toBeCalledTimes(1)
    // })

    test('Should sucessfully construct tool object with valid quote response', async () => {
      await knexQuoteService.add(validQuote)
      let generatedResponse: QuoteResponseProps
      try {
        const quoteResponseTool = new QuoteResponseTool(validQuoteResponse, validQuote.quoteId)
        quoteResponseTool.initAuthorization()
        generatedResponse = await quoteResponseTool.getQuoteResponseProps()
        expect(generatedResponse).toEqual(quoteResponseProps)
      } catch (error) {
        expect(error).toBeUndefined()
      }
      expect(authorizeQuote).toBeCalledTimes(1)
    })

    test('Should sucessfully construct error response tool object with valid error quote response', async () => {
      await knexQuoteService.add(validQuote)
      try {
        const errorQuoteResponseTool = new ErrorQuoteResponseTool(validErrorQuoteResponse, validQuote.quoteId)
        await errorQuoteResponseTool.getQuoteResponseProps()
      } catch (error) {
        expect(error).toBeUndefined()
      }
    })
  })

  describe('Testing of KnexQuotesResponse', () => {
    test('Should store a quote response to mojaQuotesResponse', async () => {
      const storedQuoteResponse = await knexQuotesResponse.store(quoteResponseProps)

      expect(storedQuoteResponse).toBeDefined()
      expect(storedQuoteResponse).toEqual({ ...quoteResponseProps, id: 1, error: null })
    })

    test('Should store an error quote response to mojaQuotesResponse', async () => {
      const storedQuoteResponse = await knexQuotesResponse.storeError(errorQuoteResponseProps)

      expect(storedQuoteResponse).toBeDefined()
      expect(storedQuoteResponse).toEqual({ ...validErrorQuoteResponse, quoteId: 'aa602839-6acb-49b8-9bed-3dc0ca3e09ab', id: 1, condition: null, expiration: null, ilpPacket: null, transferAmount: null })
    })

    test('Should throw an error if a quote with the same id is in the database', async () => {
      try {
        await knexQuotesResponse.store(quoteResponseProps)
        await knexQuotesResponse.storeError(errorQuoteResponseProps)
          .then(() => {
            expect(true).toEqual(false)
          })
      } catch (error) {
        expect(error).toEqual(new Error(`Quote response with id: ${quoteResponseProps.quoteId} already exists`))
      }
    })

    test('Should retrieve a quote response from mojaQuotesResponse by quoteId', async () => {
      await knexQuotesResponse.store(quoteResponseProps)

      const retrievedQuoteResponse = await knexQuotesResponse.get(quoteResponseProps.quoteId as string)

      expect(retrievedQuoteResponse).toEqual({ ...quoteResponseProps, id: 1, error: null })
    })
  })
})
