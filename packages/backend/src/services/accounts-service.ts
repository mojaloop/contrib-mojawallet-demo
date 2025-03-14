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

import Knex = require('knex')

export type AccountProps = {
  userId: string;
  name: string;
  assetCode: string;
  assetScale: number;
  limit: bigint;
}

export type DatabaseAccount = {
  id: string;
  userId: string;
  name: string;
  assetCode: string;
  assetScale: number;
  balance: string;
  limit: string;
}

export type Account = {
  id: string;
  userId: string;
  name: string;
  assetCode: string;
  assetScale: number;
  balance: bigint;
  limit: bigint;
}

interface AccountsService {
  add(account: AccountProps): Promise<Account>;
  update(id: string, account: AccountProps): Promise<Account>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<Account>;
  getByUserId(userId: string): Promise<Array<Account>>;
}

const dbAccountToAccount = (dbAccount: DatabaseAccount): Account => {
  return {
    ...dbAccount,
    balance: BigInt(dbAccount.balance),
    limit: BigInt(dbAccount.limit)
  }
}

export class KnexAccountService implements AccountsService {
  private _knex: Knex
  constructor (knex: Knex) {
    this._knex = knex
  }

  async add (account: AccountProps): Promise<Account> {
    const insertedAccountId = await this._knex<DatabaseAccount>('accounts').insert({
      userId: account.userId,
      name: account.name,
      assetCode: account.assetCode,
      assetScale: account.assetScale,
      limit: account.limit.toString(),
      balance: '0'
    }).then(result => result[0])

    const insertedAccount = await this._knex<DatabaseAccount>('accounts').where('id', insertedAccountId).first()

    if (!insertedAccount) {
      throw new Error('Error inserting account into database')
    }

    return dbAccountToAccount(insertedAccount)
  }

  async update (id: string, accountProps: AccountProps): Promise<Account> {
    await this._knex<DatabaseAccount>('accounts').where({ id }).update({
      limit: accountProps.limit.toString(),
      name: accountProps.name
    })

    const insertedAccount = await this._knex<DatabaseAccount>('accounts').where({ id }).first()

    if (!insertedAccount) {
      throw new Error('Error inserting account into database')
    }

    return dbAccountToAccount(insertedAccount)
  }

  async get (id: string): Promise<Account> {
    const account = await this._knex<DatabaseAccount>('accounts').where('id', id).first()

    if (!account) {
      throw new Error('Error inserting account into database')
    }
    return dbAccountToAccount(account)
  }

  async delete (id: string): Promise<void> {
    return undefined
  }

  async getByUserId (userId: string): Promise<Array<Account>> {
    const accounts = await this._knex<DatabaseAccount>('accounts').where({ userId })

    return accounts.map(account => {
      return dbAccountToAccount(account)
    })
  }
}
