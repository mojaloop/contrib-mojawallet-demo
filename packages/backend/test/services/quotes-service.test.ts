import Knex from 'knex'
import { Quote, KnexQuoteService, QuoteTools } from '../../src/services/quote-service'
import { TransactionRequest, KnexTransactionRequestService } from '../../src/services/transaction-request-service'

describe('Quotes service', () => {
  let knex: Knex
  let quote: Quote
  let quoteService: KnexQuoteService

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
          scenario: 'DEPOSIT' ,
          initiator: 'PAYER',
          initiatorType: 'CONSUMER'
        }
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
      await quoteService.add(quote)
      const storedQuote = await knex('mojaQuote').first()
      let serializedQuote = JSON.stringify(quote)
      
      expect(storedQuote).toBeDefined()
      expect(storedQuote.serializedQuote).toEqual(serializedQuote)
    })

    test('should retrieve a quote from mojaQuote', async () => {
      await knex('mojaQuote').insert({
        quoteId: '2c6af2fd-f0cb-43f5-98be-8abf539ee2c2',
        transactionId: '2c6af2fd-f0cb-43f5-98be-8abf539ee2c2',
        serializedQuote: ''
      })
      const retrievedQuote = await quoteService.get('2c6af2fd-f0cb-43f5-98be-8abf539ee2c2')

      expect(retrievedQuote).toBeDefined()
      if (retrievedQuote) {
        expect(retrievedQuote.quoteId).toEqual('2c6af2fd-f0cb-43f5-98be-8abf539ee2c2')
      }
    })
  })

  describe('Quote service tools', () => {
    let validRequest: TransactionRequest

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
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: 'party2'
          }
        },
        amount: {
          currency: 'USD',
          amount: '20'
        },
        transactionType: {
          scenario: 'DEPOSIT' ,
          initiator: 'PAYER',
          initiatorType: 'CONSUMER'
        }
      }
    })

    beforeEach(async () => {})

    afterEach(async () => {})

    afterAll(async () => {})
    
    test('should generate a quote object from a valid transaction request id', async () => {
      const quoteTools = new QuoteTools(validRequest)

      expect(quoteTools).toBeDefined()
      expect(quoteTools.getQuote().quoteId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)).toBeDefined()
    })

    test('should return a serialized quote object', async () => {
      const quoteTools = new QuoteTools(validRequest)

      expect(quoteTools.getSerializedQuote()).toBeDefined()
      expect(quoteTools.getSerializedQuote()).toEqual(JSON.stringify(quoteTools.getQuote()))
    })
  })
})