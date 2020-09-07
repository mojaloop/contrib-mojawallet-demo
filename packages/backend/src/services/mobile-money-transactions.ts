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

import { MobileMoneyTransactionRequest, MobileMoneyTransaction } from '../types/mobile-money'
import Knex = require('knex')
import uuidv4 = require('uuid/v4')

export type DBMobileMoneyTransaction = {
  type: string
  transactionReference: string
  transactionStatus: string
  oneTimeCode?: string
  amount: string
  currency: string
  debtorMSISDN: string
  creditorMSISDN: string
  creditorAccountId: string
  mojaTransactionId?: string
}

function mapToMobileTransaction (dbModel: DBMobileMoneyTransaction): MobileMoneyTransaction {
  return {
    amount: dbModel.amount,
    creditParty: [
      { key: 'msisdn', value: dbModel.creditorMSISDN },
      { key: 'accountId', value: dbModel.creditorAccountId }
    ],
    debitParty: [
      { key: 'msisdn', value: dbModel.debtorMSISDN }
    ],
    currency: dbModel.currency,
    transactionReference: dbModel.transactionReference,
    transactionStatus: dbModel.transactionStatus,
    type: 'merchantpay',
    oneTimeCode: dbModel.oneTimeCode
  }
}

export class KnexMobileMoneyTransactionService {
  private _knex: Knex

  constructor (knex: Knex) {
    this._knex = knex
  }

  async get (transactionReference: string): Promise<MobileMoneyTransaction> {
    const transaction = await this._knex<DBMobileMoneyTransaction>('mobileMoneyTransactions').where({ transactionReference }).first()

    if (!transaction) {
      throw new Error('Mobile money transaction does not exist. reference: ' + transactionReference)
    }

    return mapToMobileTransaction(transaction)
  }

  async getByMojaTransactionId (mojaTransactionId: string): Promise<MobileMoneyTransaction> {
    const transaction = await this._knex<DBMobileMoneyTransaction>('mobileMoneyTransactions').where({ mojaTransactionId }).first()

    if (!transaction) {
      throw new Error('Mobile money transaction does not exist. Mojaloop transaaction id: ' + mojaTransactionId)
    }

    return mapToMobileTransaction(transaction)
  }

  async updateMojaTransactionId (transactionReference: string, mojaTransactionId: string) {
    await this._knex<DBMobileMoneyTransaction>('mobileMoneyTransactions').where({ transactionReference }).update({ mojaTransactionId })
  }

  async updateStatus (transactionReference: string, transactionStatus: string) {
    await this._knex<DBMobileMoneyTransaction>('mobileMoneyTransactions').where({ transactionReference }).update({ transactionStatus })
  }

  async create (request: MobileMoneyTransactionRequest): Promise<MobileMoneyTransaction> {
    const creditorMsisdn = request.creditParty.find(data => data.key === 'msisdn')
    const creditorAccountId = request.creditParty.find(data => data.key === 'accountId')
    const debtorMsisdn = request.debitParty.find(data => data.key === 'msisdn')
    if (!creditorAccountId || !creditorMsisdn || !debtorMsisdn) {
      throw new Error('Not enough information to process transaction')
    }
    const transaction: DBMobileMoneyTransaction = {
      transactionReference: uuidv4(),
      transactionStatus: 'pending',
      type: request.type,
      amount: request.amount,
      currency: '840',
      creditorMSISDN: creditorMsisdn.value,
      creditorAccountId: creditorAccountId.value,
      debtorMSISDN: debtorMsisdn.value,
      oneTimeCode: request.oneTimeCode
    }

    await this._knex<DBMobileMoneyTransaction>('mobileMoneyTransactions').insert(transaction)

    return mapToMobileTransaction(transaction)
  }
}
