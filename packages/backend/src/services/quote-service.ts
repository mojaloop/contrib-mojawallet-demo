import { Party, Money, TransactionType, GeoCode, Note, DateTime, ExtensionList, TransactionRequest } from './transaction-request-service'
import Knex = require('knex')
import uuidv4 = require('uuid/v4')

export type Quote = {
  quoteId: string;
  transactionId: string;
  transactionRequestId?: string;
  payee: Party;
  payer: Party;
  amountType: 'SEND' | 'RECEIVE';
  amount: Money;
  fees?: Money;
  transactionType: TransactionType;
  geoCode?: GeoCode;
  note?: Note;
  expiration?: DateTime;
  extensionList?: ExtensionList;
}

export type MojaQuoteObj = {
  id: number;
  quoteId: string;
  transactionId: string;
  serializedQuote: string;
  quoteResponse?: string;
}

type MojaQuoteProps = {
  id?: number;
  quoteId?: string;
  transactionId?: string;
  serializedQuote?: string;
  quoteResponse?: string;
}

export class QuoteTools {
  private _quote: Quote
  private _serializedQuote: string

  constructor (transactionReq: TransactionRequest) {
    this._quote = {
      quoteId: uuidv4(),
      transactionId: uuidv4(),
      transactionRequestId: transactionReq.transactionRequestId,
      payee: transactionReq.payee,
      payer: transactionReq.payer,
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

  getQuote (): Quote {
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

  async add (quote: Quote): Promise<MojaQuoteObj> {
    const insertedQuote = await this._knex<MojaQuoteObj>('mojaQuote').insert({
      quoteId: quote.quoteId,
      transactionId: quote.transactionId,
      serializedQuote: JSON.stringify(quote)
    }).returning(['id', 'quoteId', 'transactionId', 'serializedQuote'])
    return (insertedQuote[0])
  }

  async get (quoteId: string): Promise<MojaQuoteObj | undefined> {
    const retrievedQuote = await this._knex<MojaQuoteObj>('mojaQuote')
      .where({ quoteId })
      .first()
    return (retrievedQuote)
  }

  async update (quoteId: string, updatedFields: MojaQuoteProps): Promise<MojaQuoteObj> {
    await this._knex<MojaQuoteObj>('mojaQuote').update(updatedFields).where('quoteId', quoteId)

    const updatedQuote = await this._knex<MojaQuoteObj>('mojaQuote').where('quoteId', quoteId).first()

    if (!updatedQuote) {
      throw new Error('The quote to be updated does not exist')
    } else {
      return updatedQuote
    }
  }
}
