import axios from 'axios'
import { mojaResponseService } from '../src/services/mojaResponseService'
import { createTestApp, TestAppContainer } from './utils/app'
import { TransactionRequestsPostRequest } from '../src/types/mojaloop'
import { cloneDeep } from 'lodash'

jest.mock('../src/services/mojaResponseService', () => ({
  mojaResponseService: {
    putResponse: jest.fn().mockResolvedValue(undefined),
    putErrorResponse: jest.fn().mockResolvedValue(undefined),
    quoteResponse: jest.fn().mockResolvedValue(undefined)
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
        partyIdentifier: '27123456789'
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
        partyIdentifier: '27123456789'
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
    await appContainer.accountsService.add({
      userId: '1',
      name: '+27123456789',
      assetCode: 'USD',
      assetScale: 2,
      limit: 0n
    })
    await appContainer.otpService.add({
      userId: '1',
      accountId: '1',
      expiresAt: Date.now() / 1000 + 300,
      isUsed: false,
      otp: '1111'
    })
    await appContainer.transactionsService.create('1', BigInt(10000), 'Test Money')
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
      appContainer.mojaloopRequests.putTransactionRequests = jest.fn()
      const response = await axios.post(`http://localhost:${appContainer.port}/transactionRequests`, validRequest, {
        headers: { 'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0', 'FSPIOP-Source': 'mojawallet' }
      })
      const storedRequest = await appContainer.transactionRequestService.getByRequestId(validRequest.transactionRequestId)
      // console.log(storedRequest)
      if (storedRequest) {
        expect(response.status).toEqual(202)
        expect(storedRequest.transactionRequestId).toEqual(validRequest.transactionRequestId)
        expect(storedRequest.userId).toEqual(1)
        expect(appContainer.mojaloopRequests.putTransactionRequests).toHaveBeenCalledWith(
          validRequest.transactionRequestId, {
          transactionId: storedRequest.transactionId,
          transactionRequestState: 'RECEIVED'
        },
        'mojawallet')
      } else {
        fail('Transaction Request not found')
      }
    })

    test('A transaction request with a non-existant party should return an error', async () => {
      const badPartyRequest: TransactionRequestsPostRequest = cloneDeep(validRequest)
      badPartyRequest.payer.partyIdentifier = '27321321321'
      const response = await axios.post(
        `http://localhost:${appContainer.port}/transactionRequests`,
        badPartyRequest,
        { headers: { 'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0', 'FSPIOP-Source': 'mojawallet' }
        }).catch(async error => {
        expect(error).toBeUndefined()
      })
      const storedRequest = await appContainer.transactionRequestService.getByRequestId(invalidRequest.transactionRequestId)
      expect(storedRequest).toBeUndefined()
      if (response) { expect(response.status).toEqual(202) }
      expect(response).toBeTruthy()
      expect(mojaResponseService.putErrorResponse).toHaveBeenCalledWith({
        errorInformation: {
          errorCode: '3204',
          errorDescription: 'Party not found',
          extensionList: []
        }
      }, validRequest.transactionRequestId,
      'mojawallet')
    })

    test('A transaction request in which the payer has insufficient funds should return an error', async () => {
      // await appContainer.transactionsService.create('1', BigInt(-10000), 'Remove Money')
      //
      // const response = await axios.post(
      //   `http://localhost:${appContainer.port}/transactionRequests`,
      //   validRequest,
      //   { headers: { 'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0', 'FSPIOP-Source': 'mojawallet' }
      //   })
      //
      // expect(await appContainer.transactionRequestService.getByRequestId(invalidRequest.transactionRequestId)).toBeUndefined()
      //
      // expect(response.status).toEqual(202)
      // expect(mojaResponseService.putErrorResponse).toHaveBeenCalledWith({
      //   errorInformation: {
      //     errorCode: '4000',
      //     errorDescription: 'Payer error, unable to complete transaction request',
      //     extensionList: []
      //   }
      // }, validRequest.transactionRequestId,
      // 'mojawallet')
    })

    // test('A transaction request in which the payer has no active otp should return an error', async () => {
    //   const otpProps = {
    //     userId: '1',
    //     isUsed: false,
    //     expiresAt: Date.now() / 1000
    //   }
    //   await appContainer.otpService.update(otpProps)
    //   const response = await axios.post(
    //     `http://localhost:${appContainer.port}/transactionRequests`,
    //     validRequest,
    //     { headers: { 'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0', 'FSPIOP-Source': 'mojawallet' }
    //     }).catch(async error => {
    //     expect(error).toBeUndefined()
    //   })
    //   const storedRequest = await appContainer.transactionRequestService.getByRequestId(invalidRequest.transactionRequestId)
    //   expect(storedRequest).toBeUndefined()
    //   if (response) { expect(response.status).toEqual(202) }
    //   expect(response).toBeTruthy()
    //   expect(mojaResponseService.putErrorResponse).toHaveBeenCalledWith({
    //     errorInformation: {
    //       errorCode: '4000',
    //       errorDescription: 'Payer error, unable to complete transaction request',
    //       extensionList: []
    //     }
    //   }, validRequest.transactionRequestId,
    //   'mojawallet')
    // })

    test('An invalid transaction request does not store data and returns an error', async () => {
      const response = await axios.post(
        `http://localhost:${appContainer.port}/transactionRequests`,
        invalidRequest,
        { headers: { 'Content-Type': 'application/vnd.interoperability.transactionRequests+json;version=1.0', 'FSPIOP-Source': 'mojawallet' }
        }).catch(async error => {
        expect(error).toBeUndefined()
      })
      const storedRequest = await appContainer.transactionRequestService.getByRequestId(invalidRequest.transactionRequestId)
      expect(storedRequest).toBeUndefined()
      if (response) { expect(response.status).toEqual(202) }
      expect(response).toBeTruthy()
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
