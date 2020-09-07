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

import { DatabaseAccount } from './accounts-service'
import Knex = require('knex')

export type Transaction = {
  accountId: string;
  amount: string;
  epoch: number;
  description: string;
}

interface TransactionsService {
  create(accountId: string, amount: bigint, description: string): Promise<void>;
  get(accountId: string, aggregateBy?: number): Promise<Array<Transaction>>;
}

export class KnexTransactionService implements TransactionsService {
  private _knex: Knex
  constructor (knex: Knex) {
    this._knex = knex
  }

  async create (accountId: string, amount: bigint, description = ''): Promise<void> {
    const trx = await this._knex.transaction()
    try {
      const account = await trx<DatabaseAccount>('accounts').forUpdate()
        .where({ id: accountId }).first()

      if (!account) {
        throw new Error('Account not found')
      }

      const balance = BigInt(account.balance)
      const limit = BigInt(account.limit)
      const newBalance = balance + amount

      if (newBalance < limit) {
        throw new Error('New Balance exceeds limit')
      }

      await trx<DatabaseAccount>('accounts')
        .where({ id: accountId }).update({
          balance: newBalance.toString()
        })

      await trx<Transaction>('transactions').insert({
        accountId: account.id,
        amount: amount.toString(),
        epoch: Date.now(),
        description: description
      })

      trx.commit()
    } catch (error) {
      trx.rollback()
      throw error
    }
    return Promise.resolve()
  }

  async get (accountId: string, aggregateBy?: number): Promise<Array<Transaction>> {
    if (!aggregateBy) {
      return this._knex<Transaction>('transactions').where({ accountId })
    }

    const division = process.env.KNEX_CLIENT === 'mysql' ? `epoch DIV ${aggregateBy.toString()}` : `epoch/${parseInt(aggregateBy.toString())}`

    const t: Array<Transaction> = await this._knex<Transaction>('transactions')
      .select(this._knex.raw(`${division} as utime, sum(amount) as amount, Description as description, accountId`))
      .where({ accountId }).groupByRaw('utime, description')

    return t.map((transaction: Transaction) => {
      return {
        accountId: transaction.accountId,
        amount: transaction.amount,
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        epoch: transaction.utime * aggregateBy,
        description: transaction.description
      }
    })
  }
}
