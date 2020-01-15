import { TransactionRequestsPostRequest, QuotesPostRequest, Party, Money, TransactionType } from '../types/mojaloop'
import Knex = require('knex')
import uuidv4 = require('uuid/v4')

export type MojaQuoteObj = {
  id: number;
  quoteId: string;
  transactionId: string;
  transactionRequestId?: string;
  payee: Party;
  payer: Party;
  amountType: string;
  amount: Money;
  fees?: Money;
  transactionType: TransactionType;
  serializedQuote: string;
}

type MojaQuoteProps = {
  id?: number;
  quoteId?: string;
  transactionId?: string;
  serializedQuote?: string;
  quoteResponse?: string;
}

export class QuoteTools {
  private _quote: QuotesPostRequest
  private _serializedQuote: string

  constructor (transactionReq: TransactionRequestsPostRequest, transactionId: string) {
    this._quote = {
      quoteId: uuidv4(),
      transactionId: transactionId,
      transactionRequestId: transactionReq.transactionRequestId,
      payee: transactionReq.payee,
      payer: { partyIdInfo: transactionReq.payer },
      amountType: 'RECEIVE', // RECEIVE or SEND
      amount: transactionReq.amount,
      transactionType: transactionReq.transactionType,
      geoCode: transactionReq.geoCode,
      note: transactionReq.note,
      expiration: this.getExpiry(60 * 60 * 1000), // hour from now
      extensionList: transactionReq.extensionList
    }
    this._serializedQuote = JSON.stringify(this._quote)
  }

  private getExpiry (timeFromNow: number): string {
    const now = new Date()
    const expiry = new Date(now.getTime() + timeFromNow)
    return (expiry.toISOString())
  }

  getQuote (): QuotesPostRequest {
    return (this._quote)
  }

  getSerializedQuote (): string {
    return (this._serializedQuote)
  }
}

export class KnexQuoteService {
  private _knex: Knex
  constructor (knex: Knex) {
    this._knex = knex
  }

  async add (quote: QuotesPostRequest): Promise<MojaQuoteObj> {
    const quoteCopy: QuotesPostRequest = JSON.parse(JSON.stringify(quote))
    const storedObj: any = {
      quoteId: quoteCopy.quoteId,
      transactionId: quoteCopy.transactionId,
      transactionRequestId: quoteCopy.transactionRequestId ? quoteCopy.transactionRequestId : null,
      payee: JSON.stringify(quoteCopy.payee),
      payer: JSON.stringify(quoteCopy.payer),
      amountType: quoteCopy.amountType,
      amount: JSON.stringify(quoteCopy.amount),
      fees: quoteCopy.fees ? JSON.stringify(quoteCopy.fees) : null,
      transactionType: JSON.stringify(quoteCopy.transactionType),
      serializedQuote: JSON.stringify(quote)
    }

    const insertedQuoteId = await this._knex('mojaQuote')
      .insert(storedObj)
      .then(result => result[0])

    const insertedQuote = await this._knex('mojaQuote')
      .where('id', insertedQuoteId).first()

    // console.log(insertedQuote.payee.partyIdInfo)

    insertedQuote.payee = JSON.parse(insertedQuote.payee)
    insertedQuote.payer = JSON.parse(insertedQuote.payer)
    insertedQuote.amount = JSON.parse(insertedQuote.amount)
    insertedQuote.fees = JSON.parse(insertedQuote.fees)
    insertedQuote.transactionType = JSON.parse(insertedQuote.transactionType)

    console.log(insertedQuote.payee.partyIdInfo)

    return (insertedQuote)
  }

  async get (quoteId: string): Promise<MojaQuoteObj | undefined> {
    const retrievedQuote = await this._knex('mojaQuote')
      .where({ quoteId })
      .first()

    if (retrievedQuote) {
      retrievedQuote.payee = JSON.parse(retrievedQuote.payee)
      retrievedQuote.payer = JSON.parse(retrievedQuote.payer)
      retrievedQuote.amount = JSON.parse(retrievedQuote.amount)
      retrievedQuote.fees = JSON.parse(retrievedQuote.fees)
      retrievedQuote.transactionType = JSON.parse(retrievedQuote.transactionType)
    }
    return retrievedQuote
  }

  async getByTransactionId (transactionId: string): Promise<MojaQuoteObj | undefined> {
    const retrievedQuote = await this._knex<MojaQuoteObj>('mojaQuote')
      .where({ transactionId: transactionId })
      .first()
    return (retrievedQuote)
  }

  async update (quoteId: string, updatedFields: MojaQuoteProps): Promise<MojaQuoteObj | undefined> {
    await this._knex<MojaQuoteObj>('mojaQuote')
      .update(updatedFields)
      .where('quoteId', quoteId)
    const retrievedQuote = await this._knex<MojaQuoteObj>('mojaQuote')
      .where('quoteId', quoteId).first()
    return (retrievedQuote)
  }
}
