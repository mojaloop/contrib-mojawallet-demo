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

import { KnexAccountService } from '../../src/services/accounts-service'
import { KnexTransactionService, Transaction } from '../../src/services/transactions-service'
import Knex = require('knex')

describe('Transaction Services', () => {
  let knex: Knex
  let accountService: KnexAccountService
  let transactionsService: KnexTransactionService

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        supportBigNumbers: true
      }
    })

    accountService = new KnexAccountService(knex)
    transactionsService = new KnexTransactionService(knex)
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

  test('Can create a transaction adds transaction and adjusts accounts balance', async () => {
    let account = await accountService.add({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: 0n
    })

    await transactionsService.create(account.id, 100n)
    account = await accountService.get(account.id)

    const transaction = await knex<Transaction>('transactions').first()
    expect(transaction!.accountId).toEqual(account.id.toString())
    expect(transaction!.amount).toEqual('100')
    expect(account.balance.toString()).toBe('100')
  })

  test('Creating a transaction that makes limit get exceeded fails', async () => {
    let account = await accountService.add({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: 0n
    })

    const transactionPromise = transactionsService.create(account.id, -100n)

    await expect(transactionPromise).rejects.toEqual(new Error('New Balance exceeds limit'))

    account = await accountService.get(account.id)
    const transaction = await knex<Transaction>('transactions').first()

    expect(transaction).toBeUndefined()
    expect(account.balance.toString()).toBe('0')
  })

  test('Can get transactions for an account', async () => {
    const account1 = await accountService.add({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: 0n
    })
    const account2 = await accountService.add({
      userId: '2',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: 0n
    })
    const transactionPromises = []
    transactionPromises.push(transactionsService.create('1', 100n))
    transactionPromises.push(transactionsService.create('1', 100n))
    transactionPromises.push(transactionsService.create('2', 100n))

    await Promise.all(transactionPromises)

    const transactions = await transactionsService.get('1')

    expect(transactions.length).toBe(2)
    transactions.forEach(transaction => {
      expect(transaction.accountId).toBe('1')
      expect(transaction.amount.toString()).toBe('100')
    })
  })

  test('Can get aggregate transactions for an account', async () => {
    const account1 = await accountService.add({
      userId: '1',
      name: 'Test Account',
      assetCode: 'USD',
      assetScale: 2,
      limit: 0n
    })
    const transactionPromises = []
    transactionPromises.push(transactionsService.create('1', 100n))
    transactionPromises.push(transactionsService.create('1', 100n))
    transactionPromises.push(transactionsService.create('1', 100n))

    await Promise.all(transactionPromises)

    const transactions = await transactionsService.get('1', 1000)

    expect(transactions.length).toBe(1)
  })
})
