import { KnexTransactionRequestService, isValid, TransactionRequestProps } from '../../src/services/transaction-request-service'
import { TransactionRequestsPostRequest } from '../../src/types/mojaloop'
import Knex from 'knex'

describe('Transaction Request Tests', () => {
  let validRequest: TransactionRequestsPostRequest
  let invalidRequest: TransactionRequestsPostRequest
  let validTransactionrequestProps: TransactionRequestProps
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
    validTransactionrequestProps = {
      id: 1,
      transactionId: 'xxxxxxxxxxxxxx',
      userId: 1,
      state: 'RECEIVED',
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
      },
      serializedRequest: JSON.stringify(validRequest)
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

  describe('Validate a transaction request', () => {
    it('Should identify a valid transaction request', async () => {
      const validState = isValid(validRequest)
      expect(validState.error).toBeFalsy()
    })

    it('Should identify an invalid transaction request', async () => {
      const validState = isValid(invalidRequest)
      expect(validState.error).toBeDefined()
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
      const storedRequest = await transactionRequestService.create(validRequest, 1)
      const serializedRequest = JSON.stringify(validRequest)

      validTransactionrequestProps.transactionId = storedRequest.transactionId

      expect(storedRequest).toEqual(validTransactionrequestProps)

      expect(storedRequest.transactionRequestId).toEqual(validRequest.transactionRequestId)
      expect(storedRequest.serializedRequest).toEqual(serializedRequest)
    })

    test('Should fail to serialize and write an invalid request to mojaTransactionRequest table', async () => {
      try {
        await transactionRequestService.create(invalidRequest, 1)
        .then(() => {
          expect(true).toEqual(false)
        })
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    test('Should retrieve an existing request', async () => {
      await transactionRequestService.create(validRequest, 1)
      const retrievedRequest = await transactionRequestService.getByRequestId(validRequest.transactionRequestId)

      if (retrievedRequest) {
        validTransactionrequestProps.transactionId = retrievedRequest.transactionId
  
        expect(retrievedRequest).toEqual(validTransactionrequestProps)
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Attempt to retrieve a non-existing request', async () => {
      const retrievedRequest = await transactionRequestService.getByRequestId('non-existantid')

      expect(retrievedRequest).toBe(undefined)
    })
  })
})
