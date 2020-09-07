import Knex from 'knex'
import { KnexQuoteService, QuoteTools, MojaQuoteObj } from '../../src/services/quote-service'
import { TransactionRequestsPostRequest, QuotesPostRequest } from '../../src/types/mojaloop'
import { QuoteResponse } from '../../src/services/quoteResponse-service'

describe('Quotes service', () => {
  let knex: Knex
  let quote: QuotesPostRequest
  let quoteService: KnexQuoteService
  let validQuoteResponse: QuoteResponse
  let storedQuoteObj: MojaQuoteObj

  describe('Quotes service database interaction', () => {
    beforeAll(async () => {
      knex = Knex({
        client: 'sqlite3',
        connection: {
          filename: ':memory:',
          supportBigNumbers: true
        }
      })

      quote = {
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

      storedQuoteObj = {
        id: 1,
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
        },
        serializedQuote: JSON.stringify(quote)
      }

      quoteService = new KnexQuoteService(knex)
    })

    beforeEach(async () => {
      await knex.migrate.latest()
    })

    afterEach(async () => {
      await knex.migrate.rollback()
    })

    afterAll(async () => {
      await knex.destroy()
    })

    test('Should write a quote object to mojaQuote', async () => {
      const storedQuote = await quoteService.add(quote)
      expect(storedQuote).toBeDefined()
      expect(storedQuote).toEqual({...storedQuoteObj, fees: null, transactionRequestId: null})
    })

    test('should retrieve a quote from mojaQuote', async () => {
      const storedQuote = await quoteService.add(quote)
      const retrievedQuote = await quoteService.get('aa602839-6acb-49b8-9bed-3dc0ca3e09ab')

      expect(retrievedQuote).toBeDefined()
      if (retrievedQuote) {
        expect(retrievedQuote).toEqual(storedQuote)
      }
    })

    // test('should add response to a quote with a given ID', async () => {
    //   await knex('mojaQuote').insert({
    //     quoteId: '2c6af2fd-f0cb-43f5-98be-8abf539ee2c2',
    //     transactionId: '2c6af2fd-f0cb-43f5-98be-8abf539ee2c2',
    //     serializedQuote: ''
    //   })
    //   const updatedQuote = await quoteService.update('2c6af2fd-f0cb-43f5-98be-8abf539ee2c2', {
    //     quoteResponse: JSON.stringify(validQuoteResponse)
    //   })

    //   const storedQuote = await knex<MojaQuoteObj>('mojaQuote').first()
    //   if (storedQuote)
    //     expect(storedQuote.quoteResponse).toEqual(JSON.stringify(validQuoteResponse))
    //   else
    //     expect(storedQuote).toBeDefined()
    //   expect(updatedQuote.quoteResponse).toEqual(JSON.stringify(validQuoteResponse))
    // })
  })

  describe('Quote service tools', () => {
    let validRequest: TransactionRequestsPostRequest

    beforeAll(async () => {
      validRequest = {
        transactionRequestId: 'ca919568-e559-42a8-b763-1be22179decc',
        payee: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: 'party1'
          }
        },
        payer: {
          partyIdType: 'MSISDN',
          partyIdentifier: 'party2'
        },
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
    })

    beforeEach(async () => {})

    afterEach(async () => {})

    afterAll(async () => {})

    test('should generate a quote object from a valid transaction request id', async () => {
      const quoteTools = new QuoteTools(validRequest, 'transactionId')
      expect(quoteTools).toBeDefined()
      expect(quoteTools.getQuote().quoteId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)).toBeDefined()
    })

    test('should return a serialized quote object', async () => {
      const quoteTools = new QuoteTools(validRequest, 'transactionId')

      expect(quoteTools.getSerializedQuote()).toBeDefined()
      expect(quoteTools.getSerializedQuote()).toEqual(JSON.stringify(quoteTools.getQuote()))
    })
  })
})
