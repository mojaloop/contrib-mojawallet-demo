import { TestAppContainer, createTestApp } from "../utils/app"
import { MobileMoneyTransactionRequest } from "../../src/types/mobile-money"
import Axios from "axios"
import { TransactionRequestProps } from "../../src/services/transaction-request-service"

jest.mock('uuid/v4', () => () => 'de87da63-bd40-4b2c-896f-947a9b644c81')

describe('Mobile Money Transactions API', () => {
  let appContainer: TestAppContainer

  beforeAll(() => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    appContainer.pusherService.trigger = jest.fn()
    await appContainer.knex.migrate.latest()

    await appContainer.userService.store({
      username: '+27829876544',
      password: 'password'
    })
    await appContainer.accountsService.add({
      userId: '1',
      name: 'Jane',
      assetCode: 'USD',
      assetScale: 2,
      limit: 100000n
    })
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('POST /transactions', () => {
    test('returns a 200 if type is merchant pay', async () => {
      const transaction: MobileMoneyTransactionRequest = {
        amount: '100',
        currency: '840',
        type: 'merchantpay',
        creditParty: [
          { key: 'msisdn', value: '+27829876543' },
          { key: 'accountId', value: '1' }
        ],
        debitParty: [
          { key: 'msisdn', value: '+27829876544' }
        ]
      }
      appContainer.mojaloopRequests.postTransactionRequests = jest.fn()
  
      const response = await Axios.post(`http://localhost:${appContainer.port}/mm/transactions`, transaction)
  
      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({
        ...transaction,
        transactionReference: 'de87da63-bd40-4b2c-896f-947a9b644c81',
        transactionStatus: 'pending'
      })
    })
  
    test('returns 501 if type is not merchant pay', async () => {
      const transaction: MobileMoneyTransactionRequest = {
        amount: '100',
        currency: '840',
        type: 'transfer',
        creditParty: [
          { key: 'msisdn', value: '+27829876543' },
          { key: 'accountId', value: '1' }
        ],
        debitParty: [
          { key: 'msisdn', value: '+27829876544' }
        ]
      }
      appContainer.mojaloopRequests.postTransactionRequests = jest.fn()
  
      try {
        await Axios.post(`http://localhost:${appContainer.port}/mm/transactions`, transaction)
      } catch (error) {
        expect(error.response.status).toBe(501)
        return
      }
  
      fail("Api should've returned 501")
    })
  
    test('stores mobile money transaction', async () => {
      const transaction: MobileMoneyTransactionRequest = {
        amount: '100',
        currency: '840',
        type: 'merchantpay',
        creditParty: [
          { key: 'msisdn', value: '+27829876543' },
          { key: 'accountId', value: '1' }
        ],
        debitParty: [
          { key: 'msisdn', value: '+27829876544' }
        ],
        oneTimeCode: 'abcde'
      }
      appContainer.mojaloopRequests.postTransactionRequests = jest.fn()
  
      const response = await Axios.post(`http://localhost:${appContainer.port}/mm/transactions`, transaction)
      
      const storedTrx = await appContainer.mobileMoneyTransactions.get('de87da63-bd40-4b2c-896f-947a9b644c81')
      expect(response.status).toBe(200)
      expect(storedTrx).toMatchObject({
        amount: '100',
        currency: '840',
        debitParty:[
          { key: 'msisdn', value: '+27829876544' }
        ],
        creditParty:[
          { key: 'msisdn', value: '+27829876543' },
          { key: 'accountId', value: '1' }
        ],
        oneTimeCode: 'abcde'
      })    
    })
  
    test('sends transaction request to Mojaloop', async () => {
      const transaction: MobileMoneyTransactionRequest = {
        amount: '100',
        currency: '840',
        type: 'merchantpay',
        creditParty: [
          { key: 'msisdn', value: '+27829876543' },
          { key: 'accountId', value: '1' }
        ],
        debitParty: [
          { key: 'msisdn', value: '+27829876544' }
        ],
        oneTimeCode: 'abcde'
      }
      appContainer.mojaloopRequests.postTransactionRequests = jest.fn()
  
      const response = await Axios.post(`http://localhost:${appContainer.port}/mm/transactions`, transaction)
  
      const expectedTransactionRequest = {
        amount: {
          amount: '100',
          currency: 'USD'
        },
        payee: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '+27829876543'
          }
        },
        payer: {
          partyIdType: 'MSISDN',
          partyIdentifier: '+27829876544',
          fspId: 'mojawallet'
        },
        transactionRequestId: 'de87da63-bd40-4b2c-896f-947a9b644c81',
        id: 1,
        userId: 1,
        state: 'RECEIVED',
        transactionType: {
          scenario: "PAYMENT",
          initiator: "PAYEE",
          initiatorType: "BUSINESS"
        },
        oneTimeCode: 'abcde'
      }
  
      expect(appContainer.mojaloopRequests.postTransactionRequests).toHaveBeenCalled()
    })
  })

  describe('GET /transactions', () => {
    test('returns transaction object', async () => {
      const transactionRequest: MobileMoneyTransactionRequest = {
        amount: '100',
        currency: '840',
        type: 'merchantpay',
        creditParty: [
          { key: 'msisdn', value: '+27829876543' },
          { key: 'accountId', value: '1' }
        ],
        debitParty: [
          { key: 'msisdn', value: '+27829876544' }
        ],
        oneTimeCode: 'abc'
      }
      const transaction = await appContainer.mobileMoneyTransactions.create(transactionRequest)

      const response = await Axios.get(`http://localhost:${appContainer.port}/mm/transactions/${transaction.transactionReference}`)

      expect(response.data).toMatchObject(transaction)
    })

    test('returns 404 if transaction does not exist', async () => {
      try {
        await Axios.get(`http://localhost:${appContainer.port}/mm/transactions/not-a-transaction`)
      } catch (error) {
        expect(error.response.status).toBe(404)
        return
      }

      fail()
    })
  })
})