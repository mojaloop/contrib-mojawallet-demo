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

import { DatabaseAccount, KnexAccountService } from '../../src/services/accounts-service'
import Knex = require('knex')

describe('Accounts Services', () => {
  let knex: Knex
  let accountService: KnexAccountService

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        supportBigNumbers: true
      }
    })

    accountService = new KnexAccountService(knex)
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

  test('Can get an account', async () => {
    const id = await knex<DatabaseAccount>('accounts').insert({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: '0',
      balance: '0'
    }).then(result => String(result[0]))

    const account = await accountService.get(id)
    expect(account.name).toEqual('Test Account')
    expect(account.userId).toEqual('1')
    expect(account.assetCode).toEqual('USD')
    expect(account.assetScale).toEqual(2)
    expect(account.limit.toString()).toEqual(BigInt(0).toString())
    expect(account.balance.toString()).toEqual(BigInt(0).toString())
  })

  test('Can add an account', async () => {
    const insertedAccount = await accountService.add({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: 0n
    })

    const account = await accountService.get(insertedAccount.id)

    expect(account.name).toEqual('Test Account')
    expect(account.userId).toEqual('1')
    expect(account.assetCode).toEqual('USD')
    expect(account.assetScale).toEqual(2)
    expect(account.limit.toString()).toEqual(BigInt(0).toString())
    expect(account.balance.toString()).toEqual(BigInt(0).toString())
  })

  test('Can update an account', async () => {
    const id = await knex<DatabaseAccount>('accounts').insert({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: '0',
      balance: '0'
    }).then(result => String(result[0]))

    const account = await accountService.update(id, {
      userId: '1',
      name: 'Test2 Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: -100n
    })

    expect(account.name).toEqual('Test2 Account')
    expect(account.userId).toEqual('1')
    expect(account.assetCode).toEqual('USD')
    expect(account.assetScale).toEqual(2)
    expect(account.limit.toString()).toEqual(BigInt(-100).toString())
    expect(account.balance.toString()).toEqual(BigInt(0).toString())
  })

  test('Can get accounts by userId', async () => {
    await knex<DatabaseAccount>('accounts').insert({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: '0',
      balance: '0'
    }).then(result => String(result[0]))
    await knex<DatabaseAccount>('accounts').insert({
      userId: '2',
      name: 'Test Account 2',
      assetCode: 'USD',
      assetScale: 2,
      limit: '0',
      balance: '0'
    }).then(result => String(result[0]))

    const accounts = await accountService.getByUserId('1')

    const account = accounts[0]
    expect(accounts.length).toBe(1)
    expect(account.userId).toBe('1')
    expect(account.name).toBe('Test Account')
  })
})
