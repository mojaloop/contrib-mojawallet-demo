import axios from 'axios'
import { MojaQuoteObj } from '../src/services/quote-service'
import { QuoteResponse } from '../src/services/quoteResponse-service'
import { authorizeQuote } from '../src/services/authorization-service'
import { QuotesPostRequest } from '../src/types/mojaloop'
import uuid from 'uuid'
import { createTestApp, TestAppContainer } from './utils/app'

jest.mock('../src/services/authorization-service', () => ({
  authorizeQuote: jest.fn()
}))

describe('Response from switch after a quote is sent', () => {
  let appContainer: TestAppContainer
  let validQuote: QuotesPostRequest
  let validQuoteResponse: QuoteResponse
  let invalidQuoteResponse: QuoteResponse

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
    invalidQuoteResponse = {
      transferAmount: {
        currency: 'USD',
        amount: '20'
      },
      expiration: 'asd',
      ilpPacket: 'abc123',
      condition: '1234567890123456789012345678901234567890123'
    }
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
      await appContainer.quoteService.add(validQuote)
      const response = await axios.put(`http://localhost:${appContainer.port}/quotes/${validQuote.quoteId}`, validQuoteResponse)
      const retrievedQuote = await appContainer.knex<MojaQuoteObj>('mojaQuote').where({ quoteId: validQuote.quoteId }).first()

      if (retrievedQuote) {
        expect(retrievedQuote.quoteResponse).toEqual(JSON.stringify(validQuoteResponse))
        expect(response.status).toEqual(200)
        expect(authorizeQuote).toBeCalledTimes(1)
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Should return 400 status and not initiate Authorization on invalid quote response', async () => {
      await appContainer.quoteService.add(validQuote)
      axios.put(`http://localhost:${appContainer.port}/quotes/${validQuote.quoteId}`, invalidQuoteResponse)
        .then(response => {
          expect(true).toEqual(false)
        })
        .catch(async error => {
          expect(error.response.status).toEqual(400)
          const retrievedQuote = await appContainer.knex<MojaQuoteObj>('mojaQuote').where({ quoteId: validQuote.quoteId }).first()
          if (retrievedQuote) {
            expect(retrievedQuote.quoteResponse).toEqual(null)
            expect(authorizeQuote).toBeCalledTimes(0)
          } else {
            expect(true).toEqual(false)
          }
        })
    })

    test('Should return 404 status and not initiate Authorization on unknown quote id', async () => {
      axios.put(`http://localhost:${appContainer.port}/quotes/${uuid.v4}`, validQuoteResponse)
        .then(response => {
          expect(true).toEqual(false)
        })
        .catch(error => {
          expect(error.response.status).toEqual(404)
          expect(authorizeQuote).toBeCalledTimes(0)
        })
    })
  })
})
