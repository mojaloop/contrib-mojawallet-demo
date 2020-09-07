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

import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'
import { StoredTransfer } from '../src/services/mojaloop-service'

describe('Failed transfer test', () => {
  let appContainer: TestAppContainer

  beforeAll(async () => {
    appContainer = createTestApp()

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
    await appContainer.transactionsService.create('1', BigInt(-10000), 'Test Transaction')
    await appContainer.knex<StoredTransfer>('transfers').insert({
      transferId: 'bf7a9f12-c0b0-4a99-beb9-bd897ee50e51',
      transactionId: 'bf7a9f12-c0b0-4a99-beb9-bd897ee50e52',
      transactionRequestId: 'bf7a9f12-c0b0-4a99-beb9-bd897ee50e53',
      quoteId: 'bf7a9f12-c0b0-4a99-beb9-bd897ee50e54',
      accountId: '1',
      isReverted: false
    })
    await appContainer.transactionRequestService.create({
      transactionRequestId: 'bf7a9f12-c0b0-4a99-beb9-bd897ee50e53',
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
        amount: '100'
      },
      transactionType: {
        scenario: 'DEPOSIT',
        initiator: 'PAYER',
        initiatorType: 'CONSUMER'
      }
    }, 1)
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Handling a transfer error response', () => {
    
    test('Handling a failed response', async () => {
      const response = await axios.put(`http://localhost:${appContainer.port}/transfers/bf7a9f12-c0b0-4a99-beb9-bd897ee50e51/error`)
      expect(response.status).toEqual(200)
      // expect funds to be reimbursed to payer
      const account =  await appContainer.accountsService.get('1')
      expect(Number(account.balance)).toEqual(10000)
    })

    test('Unrecognized transfer Id does not refund payer', async () => {
      const response = await axios.put(`http://localhost:${appContainer.port}/transfers/bf7a9f12-c0b0-4a99-beb9-bd897ee50e50/error`)
      expect(response.status).toEqual(200)
      const account =  await appContainer.accountsService.get('1')
      expect(Number(account.balance)).toEqual(0)
    })

    test('Multiple errors to the same transfer does not revert the transaction multiple times', async () => {
      const response = await axios.put(`http://localhost:${appContainer.port}/transfers/bf7a9f12-c0b0-4a99-beb9-bd897ee50e51/error`)
      const response2 = await axios.put(`http://localhost:${appContainer.port}/transfers/bf7a9f12-c0b0-4a99-beb9-bd897ee50e51/error`)
      expect(response.status).toEqual(200)
      expect(response2.status).toEqual(200)
      const account =  await appContainer.accountsService.get('1')
      expect(Number(account.balance)).toEqual(10000)
    })
  })
})
