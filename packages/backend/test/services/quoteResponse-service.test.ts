import { QuoteResponse, QuoteResponseTool } from '../../src/services/quoteResponse-service'
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
  let validQuote: QuotesPostRequest
  let validQuoteResponse: QuoteResponse
  let invalidQuoteResponse: QuoteResponse

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      }
    })
    knexQuoteService = new KnexQuoteService(knex)
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
    test('Should sucessfully construct tool object with valid quote response', async () => {
      await knexQuoteService.add(validQuote)
      let serializedResponse: string
      try {
        const quoteResponseTool = new QuoteResponseTool(validQuoteResponse, validQuote.quoteId)
        quoteResponseTool.initAuthorization()
        serializedResponse = await quoteResponseTool.getSerializedResponse()
        expect(serializedResponse).toEqual(JSON.stringify(validQuoteResponse))
      } catch (error) {
        console.log(error)
        expect(true).toEqual(false)
      }
      expect(authorizeQuote).toBeCalledTimes(1)
    })

    test('Should throw error on using invalid quote response', async () => {
      await knexQuoteService.add(validQuote)
      expect(() => {
        const quoteResponseTool = new QuoteResponseTool(invalidQuoteResponse, validQuote.quoteId)
        quoteResponseTool.initAuthorization()
      }).toThrow()
      expect(authorizeQuote).toBeCalledTimes(0)
    })
  })
})
