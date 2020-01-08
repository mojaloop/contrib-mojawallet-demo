import axios from 'axios'
import { TestAppContainer, createTestApp } from './utils/app'
import { OtpTools } from '../src/services/otp-service'

describe('Authorization Response', () => {

  let appContainer: TestAppContainer
  let user: any
  let account: any
  let otp: any

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
    user = await appContainer.userService.store({
      password: '123',
      username: '+271337'
    })
    account = await appContainer.accountsService.add({
      assetCode: 'XML',
      assetScale: 2,
      limit: 0n,
      name: 'Awesome Account',
      userId: user.id
    })
    const otpObj = new OtpTools(user.id, account.id)
    await appContainer.otpService.add(otpObj.getOtp())
    otp = otpObj.getOtp().otp
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await appContainer.knex.migrate.rollback()
  })

  afterAll(async () => {
    await appContainer.knex.destroy()
    appContainer.server.close()
  })

  describe('Handling PUT to "/authorizations/{ID}"', () => {

    test('Can handle getting an authorization PUT request', async () => {

      const response = await axios.put(`http://localhost:${appContainer.port}/authorizations/${123}`, {
        authenticationInfo: {
          authentication: 'OTP',
          authenticationValue: otp
        },
        responseType: 'ENTERED'
      })

      expect(response.status).toBe(200)
    })

    test('If authorization is valid transfer is initiated', async () => {
      appContainer.mojaloopService.initiateTransfer = jest.fn()

      const transactionRequest = await appContainer.transactionRequestService.create({
        transactionRequestId: 'ca919568-e559-42a8-b763-1be22179decc',
        payee: {
          partyIdInfo: {
            partyIdType: 'DEVICE',
            partyIdentifier: 'atmId'
          }
        },
        payer: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '271337'
          }
        },
        amount: {
          currency: 'XML',
          amount: '20'
        },
        transactionType: {
          scenario: 'DEPOSIT' ,
          initiator: 'PAYER',
          initiatorType: 'CONSUMER'
        }
      }, user.id)

      const response = await axios.put(`http://localhost:${appContainer.port}/authorizations/ca919568-e559-42a8-b763-1be22179decc`, {
        authenticationInfo: {
          authentication: 'OTP',
          authenticationValue: otp
        },
        responseType: 'ENTERED'
      })

      expect(appContainer.mojaloopService.initiateTransfer).toBeCalledWith('ca919568-e559-42a8-b763-1be22179decc')
      expect(response.status).toBe(200)
    })

    test('If authorization is invalid dont initiate transfer', async () => {
      appContainer.mojaloopService.initiateTransfer = jest.fn()

      const transactionRequest = await appContainer.transactionRequestService.create({
        transactionRequestId: 'ca919568-e559-42a8-b763-1be22179decc',
        payee: {
          partyIdInfo: {
            partyIdType: 'DEVICE',
            partyIdentifier: 'atmId'
          }
        },
        payer: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '271337'
          }
        },
        amount: {
          currency: 'XML',
          amount: '20'
        },
        transactionType: {
          scenario: 'DEPOSIT' ,
          initiator: 'PAYER',
          initiatorType: 'CONSUMER'
        }
      }, user.id)

      const response = await axios.put(`http://localhost:${appContainer.port}/authorizations/ca919568-e559-42a8-b763-1be22179decc`, {
        authenticationInfo: {
          authentication: 'OTP',
          authenticationValue: '1234'
        },
        responseType: 'ENTERED'
      })

      expect(appContainer.mojaloopService.initiateTransfer).toBeCalledTimes(0)
      expect(response.status).toBe(200)
    })
  })
})
