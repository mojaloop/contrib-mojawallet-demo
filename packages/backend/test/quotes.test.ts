import { TestAppContainer, createTestApp } from "./utils/app"
import { MobileMoneyTransactionRequest, MobileMoneyTransaction } from "../src/types/mobile-money"
import Axios from "axios"
import { QuotesPostRequest } from "../src/types/mojaloop"

describe('Quote Request', () => {
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
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  test('charges 0 USD in fees', async () => {
    const quoteRequest: QuotesPostRequest = {
      amount: {
        amount: '100',
        currency: 'USD'
      },
      amountType: 'SEND',
      payee: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: '+829876544'
        }
      },
      payer: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: '+829876543'
        }
      },
      quoteId: '123456567',
      transactionId: '1111111',
      transactionType: {
        initiator: '',
        initiatorType: 'BUSINESS',
        scenario: ''
      }
    }
    Date.now = jest.fn().mockReturnValue(0)
    appContainer.mojaloopRequests.putQuotes = jest.fn()
    appContainer.ilpService.getQuoteResponseIlp = jest.fn().mockReturnValue({ condition: 'test-condition', ilpPacket: 'ilppacket' })

    const response = await Axios.post(`http://localhost:${appContainer.port}/quotes`, quoteRequest, { headers: { 'fspiop-source': 'mojawallet' } })

    expect(response.status).toBe(201)
    expect(appContainer.mojaloopRequests.putQuotes).toHaveBeenCalledWith('123456567', {
      condition: 'test-condition',
      ilpPacket: 'ilppacket',
      transferAmount: {
        amount: '100',
        currency: 'USD'
      },
      expiration: new Date(Date.now() + 120 * 1000).toISOString()
    }, 'mojawallet')
  })
})