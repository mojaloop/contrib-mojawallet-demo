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
