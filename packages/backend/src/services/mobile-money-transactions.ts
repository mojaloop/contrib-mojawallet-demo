import Knex = require('knex')
import uuidv4 = require('uuid/v4')
import { MobileMoneyTransactionRequest, MobileMoneyTransaction } from '../types/mobile-money'

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

export class KnexMobileMoneyTransactionService {
  private _knex: Knex

  constructor(knex: Knex) {
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
