import axios from 'axios'
import { mojaResponseService } from '../src/services/mojaResponseService'
import { createTestApp, TestAppContainer } from './utils/app'
import { TransactionRequestsPostRequest } from '../src/types/mojaloop'
jest.mock('../src/services/mojaResponseService', () => ({
  mojaResponseService: {
    putResponse: jest.fn(),
    putErrorResponse: jest.fn(),
    quoteResponse: jest.fn()
  }
}))

describe('Transaction Request Test', () => {
  let appContainer: TestAppContainer
  let validRequest: TransactionRequestsPostRequest
  let invalidRequest: TransactionRequestsPostRequest

  beforeAll(async () => {
    appContainer = createTestApp()

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
        partyIdentifier: '+27123456789'
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
        partyIdentifier: '+27123456789'
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

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
    await appContainer.userService.store({
      username: '+27123456789',
      password: 'password'
    })
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Handling a transaction request post', () => {
    test('Can store a valid transaction request and returns 200', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/transactionRequests`, validRequest, {
        headers: { 'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0', 'FSPIOP-Source': 'mojawallet' }
      })
      const storedRequest = await appContainer.transactionRequestService.getByRequestId(validRequest.transactionRequestId)
      // console.log(storedRequest)
      if (storedRequest) {
        expect(response.status).toEqual(200)
        expect(storedRequest.transactionRequestId).toEqual(validRequest.transactionRequestId)
        expect(storedRequest.userId).toEqual(1)
        expect(mojaResponseService.putResponse).toHaveBeenCalledWith({
          transactionId: storedRequest.transactionId,
          transactionRequestState: 'RECEIVED'
        }, validRequest.transactionRequestId,
        'mojawallet')
      } else {
        fail('Transaction Request not found')
      }
    })

    test('An invalid transaction request does not store data and returns 400', async () => {
      await axios.post(`http://localhost:${appContainer.port}/transactionRequests`, invalidRequest, {
        headers: { 'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0', 'FSPIOP-Source': 'mojawallet' }
      }).catch(async error => {
        const storedRequest = await appContainer.transactionRequestService.getByRequestId(invalidRequest.transactionRequestId)
        expect(storedRequest).toBeUndefined()
        expect(error.response.status).toEqual(400)
        expect(mojaResponseService.putErrorResponse).toHaveBeenCalledWith({
          errorInformation: {
            errorCode: '3100',
            errorDescription: 'Invalid transaction request',
            extensionList: []
          }
        }, invalidRequest.transactionRequestId,
        'mojawallet')
      })
    })
  })
})
