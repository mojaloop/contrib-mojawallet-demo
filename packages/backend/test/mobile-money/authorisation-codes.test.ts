/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Cairin Michie <cairin@coil.com>
- Donovan Changfoot <don@coil.com>
- Matthew de Haast <matt@coil.com>
- Talon Patterson <talon.patterson@coil.com>
*****/

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
