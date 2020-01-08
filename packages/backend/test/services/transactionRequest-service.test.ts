import { TransactionRequest, TransactionRequestTools, KnexTransactionRequestService } from '../../src/services/transaction-request-service'
import Knex from 'knex'

describe('Transaction Request Tests', () => {
  let validRequest: TransactionRequest
  let invalidRequest: TransactionRequest
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
    invalidRequest = {
      transactionRequestId: 'ca919568-e559-42a8763-1be22179decc',
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

  describe('Validate a transaction request', () => {

    it('Should identify a valid transaction request', async () => {

      const myRequest = new TransactionRequestTools(validRequest)
      expect(myRequest.getValidStatus()).toEqual(true)
    })

    it('Should identify an invalid transaction request', async () => {

      const myRequest = new TransactionRequestTools(invalidRequest)
      expect(myRequest.getValidStatus()).toEqual(false)
    })
  })

  describe('Receiving and retrieving a transaction request', () => {
    let knex: Knex
    let transactionRequestService: KnexTransactionRequestService
  
    beforeAll(async () => {
      knex = Knex({
        client: 'sqlite3',
        connection: {
          filename: ':memory:',
          supportBigNumbers: true
        }
      })
  
      transactionRequestService = new KnexTransactionRequestService(knex)
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

    test('Should serialize and write a valid request to mojaTransactionRequest table', async () => {

      await transactionRequestService.create(validRequest, 1)
      const storedRequest = await knex('mojaTransactionRequest').first()
      let serializedRequest = JSON.stringify(validRequest)

      expect(storedRequest.transactionRequestId).toEqual(validRequest.transactionRequestId)
      expect(storedRequest.serializedRequest).toEqual(serializedRequest)
      expect(storedRequest.valid).toEqual(1)
    })

    test('Should fail to serialize and write an invalid request to mojaTransactionRequest table', async () => {

      const myTest = async () => { await transactionRequestService.create(invalidRequest, 1) }

      expect(myTest).toThrowError
    })

    test('Should retrieve an existing request', async () => {
      await transactionRequestService.create(validRequest, 1)
      const retrievedRequest = await transactionRequestService.getByRequestId(validRequest.transactionRequestId)
      let serializedRequest = JSON.stringify(validRequest)

      if (retrievedRequest) {
        expect(retrievedRequest.transactionRequestId).toEqual(validRequest.transactionRequestId)
        expect(retrievedRequest.serializedRequest).toEqual(serializedRequest)
        expect(retrievedRequest.valid).toEqual(1)
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Attempt to retrieve a non-existing request', async () => {
      const retrievedRequest = await transactionRequestService.getByRequestId("non-existantid")

      expect(retrievedRequest).toBe(undefined)
    })
  })
})
