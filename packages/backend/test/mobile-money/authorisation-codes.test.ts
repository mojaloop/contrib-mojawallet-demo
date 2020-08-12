import { TestAppContainer, createTestApp } from "../utils/app"
import { MobileMoneyAuthorizationCodeRequest, MobileMoneyAuthorizationCodeResponse } from "../../src/types/mobile-money"
import { Account } from "../../src/services/accounts-service"
import Axios from "axios"

describe('Authorization Codes', () => {
  let appContainer: TestAppContainer
  let account: Account

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
    account = await appContainer.accountsService.add({
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

  test('can create an authorization code for an account using its accountId', async () => {
    const request: MobileMoneyAuthorizationCodeRequest = {
      amount: '100',
      currency: '840',
      requestDate: "2020-01-01T00:00:00.000Z"
    }

    const response = await Axios.post<MobileMoneyAuthorizationCodeResponse>(`http://localhost:${appContainer.port}/mm/accounts/accountId/${account.id}/authorisationCodes`, request)

    const activeOtp = await appContainer.otpService.getActiveOtp('1')
    expect(response.data.codeState).toBe('active')
    expect(activeOtp).not.toBeUndefined()
    expect(response.data.authorisationCode).toBe(activeOtp!.otp)
  })
})