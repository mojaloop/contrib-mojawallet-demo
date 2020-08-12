import { TestAppContainer, createTestApp } from "./utils/app"
import { MobileMoneyTransactionRequest, MobileMoneyTransaction } from "../src/types/mobile-money"
import Axios from "axios"
import { AuthorizationsIDPutResponse } from "../src/types/mojaloop"
import got from 'got/dist/source'

describe('GET /authorizations/:trxReqId', () => {
  let appContainer: TestAppContainer
  let transactionRequestId: string

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
      oneTimeCode: 'abcde'
    }
    appContainer.mojaloopRequests.postTransactionRequests = jest.fn()
    const response = await Axios.post<MobileMoneyTransaction>(`http://localhost:${appContainer.port}/mm/transactions`, transactionRequest)
    transactionRequestId = response.data.transactionReference
    expect(appContainer.mojaloopRequests.postTransactionRequests).toHaveBeenCalled()
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  test('retrieves oneTimeCode from mobile money transaction related to transaction request and sends authorization response', async () => {
    appContainer.mojaloopRequests.putAuthorizations = jest.fn().mockResolvedValue({})
    got.put = jest.fn().mockResolvedValue({})
    Date.now = jest.fn().mockResolvedValue(0)
    const response = await Axios.get(`http://localhost:${appContainer.port}/authorizations/${transactionRequestId}?amount=100`, { headers: { 'fspiop-source': 'mojawallet' } })

    const mojaloopAuthResponse: AuthorizationsIDPutResponse = {
      responseType: 'ENTERED',
      authenticationInfo: {
        authentication: 'OTP',
        authenticationValue: 'abcde'
      }
    }
    expect(got.put).toHaveBeenCalledWith('https://transaction-request-service.mojaloop.app/authorizations/' + transactionRequestId, {
      headers: {
        'Content-Type': 'application/vnd.interoperability.authorizations+json;version=1.0',
        'Accept': 'application/vnd.interoperability.authorizations+json;version=1.0',
        'FSPIOP-Source': 'mojawallet',
        'FSPIOP-Destination': 'mojawallet',
        'Date': new Date().toUTCString()
      },
      json: mojaloopAuthResponse
    })
    expect(response.status).toBe(200)
  })
})