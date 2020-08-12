import { ExtensionList } from './transaction-request-service'
import { Money, GeoCode, ErrorInformation } from '../types/mojaloop'
import Joi, { ValidationResult } from 'joi'
import { authorizeQuote } from './authorization-service'
import Knex from 'knex'

export type QuoteResponse = {
  transferAmount: Money;
  payeeReceiveAmount?: Money;
  payeeFspFee?: Money;
  payeeFspComission?: Money;
  expiration: string;
  geoCode?: GeoCode;
  ilpPacket: string;
  condition: string;
  extensionList?: ExtensionList;
}

export type ErrorQuoteResponse = {
  error: ErrorInformation
}

export type QuoteResponseProps = {
  quoteId: string;
  transferAmount: Money;
  expiration: string;
  ilpPacket: string;
  condition: string;
}

export type ErrorQuoteResponseProps = {
  quoteId: string
  error: ErrorInformation
}
export class QuoteResponseTool {
  private _quoteId: string
  private _quoteResponseProps: QuoteResponseProps

  constructor (quoteResponse: QuoteResponse, quoteId: string) {
    this._quoteId = quoteId
    if (this.isValidQuoteResponse(quoteResponse).error) {
      console.log(this.isValidQuoteResponse(quoteResponse).error)
      throw new Error('Bad quote response:' + this.isValidQuoteResponse(quoteResponse).error.toString())
    }
    this._quoteResponseProps = {
      quoteId: quoteId,
      transferAmount: quoteResponse.transferAmount,
      expiration: new Date(quoteResponse.expiration).toISOString().slice(0, 19).replace('T', ' '),
      ilpPacket: quoteResponse.ilpPacket,
      condition: quoteResponse.condition
    }
  }

  private isValidQuoteResponse (quoteResponse: QuoteResponse): ValidationResult<object> {
    const moneySchema = Joi.object({
      currency: Joi.string().regex(/^[A-Z]{3}/).required(),
      amount: Joi.string().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).required()
    })

    // const dateTimeSchema = Joi.string().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468\][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/)

    const geoCodeSchema = Joi.object({
      latitude: Joi.string().regex(/^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/).required(),
      longitude: Joi.string().regex(/^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$/).required()
    })

    const ilpPacketSchema = Joi.string().regex(/^[A-Za-z0-9-_]+[=]{0,2}$/)

    const ilpConditionSchema = Joi.string().regex(/^[A-Za-z0-9-_]{43}$/)

    const extensionListSchema = Joi.array().length(16).items(Joi.object({
      extensionKey: Joi.string().max(32).required(),
      extensionVAlue: Joi.string().max(128).required()
    }))

    const quoteResponseSchema = Joi.object({
      transferAmount: moneySchema.required(),
      payeeReceiveAmount: moneySchema,
      payeeFspFee: moneySchema,
      payeeFspComission: moneySchema,
      expiration: Joi.string().required(),
      geoCode: geoCodeSchema,
      ilpPacket: ilpPacketSchema.required(),
      condition: ilpConditionSchema.required(),
      extensionList: extensionListSchema
    })

    return Joi.validate(quoteResponse, quoteResponseSchema)
  }

  initAuthorization () {
    authorizeQuote(this._quoteId)
  }

  getQuoteResponseProps (): QuoteResponseProps {
    return (this._quoteResponseProps)
  }
}

export class ErrorQuoteResponseTool {
  private _quoteId: string
  private _quoteResponseProps: ErrorQuoteResponseProps

  constructor (errorQuoteResponse: ErrorQuoteResponse, quoteId: string) {
    this._quoteId = quoteId
    if (this.isValid(errorQuoteResponse).error) {
      console.log(this.isValid(errorQuoteResponse).error)
      throw new Error('Bad quote error response:' + this.isValid(errorQuoteResponse).error.toString())
    }
    this._quoteResponseProps = {
      quoteId: quoteId,
      error: errorQuoteResponse.error
    }
  }

  private isValid (quoteResponse: ErrorQuoteResponse): ValidationResult<object> {
    const extensionListSchema = Joi.array().length(16).items(Joi.object({
      extensionKey: Joi.string().max(32).required(),
      extensionVAlue: Joi.string().max(128).required()
    }))

    const ErrorQuoteResponseSchema = Joi.object({
      error: Joi.object({
        errorCode: Joi.string().regex(/^[1-9]\d{3}$/).required(),
        errorDescription: Joi.string().max(128).required(),
        extensionList: extensionListSchema
      }).required()
    })

    return Joi.validate(quoteResponse, ErrorQuoteResponseSchema)
  }

  getQuoteResponseProps (): ErrorQuoteResponseProps {
    return (this._quoteResponseProps)
  }
}

export class KnexQuotesResponse {
  private _knex: Knex
  constructor (knex: Knex) {
    this._knex = knex
  }

  async store (quoteResponseProps: QuoteResponseProps): Promise<QuoteResponseProps> {
    const retrievedQuoteResponse = await this._knex<QuoteResponseProps>('mojaQuotesResponse')
      .where({ quoteId: quoteResponseProps.quoteId })
      .first()

    if (retrievedQuoteResponse) {
      throw new Error(`Quote response with id: ${quoteResponseProps.quoteId} already exists`)
    }

    const storedObject: any = JSON.parse(JSON.stringify(quoteResponseProps))
    if (quoteResponseProps.transferAmount) { storedObject.transferAmount = JSON.stringify(storedObject.transferAmount) }
    console.log('Stored object ', storedObject)
    const insertedQuoteResponseId = await this._knex<QuoteResponseProps>('mojaQuotesResponse')
      .insert(storedObject)
      .then(result => result[0])

    const insertedQuoteResponse = await this._knex<QuoteResponseProps>('mojaQuotesResponse')
      .where('id', insertedQuoteResponseId).first()

    if (!insertedQuoteResponse) {
      throw new Error('Error inserting quote response')
    }
    insertedQuoteResponse.transferAmount = JSON.parse(insertedQuoteResponse.transferAmount as any)

    console.log(insertedQuoteResponse)

    return insertedQuoteResponse
  }

  async storeError (quoteResponseProps: ErrorQuoteResponseProps): Promise<ErrorQuoteResponse> {
    const retrievedQuoteResponse = await this._knex<QuoteResponseProps>('mojaQuotesResponse')
      .where({ quoteId: quoteResponseProps.quoteId })
      .first()

    if (retrievedQuoteResponse) {
      throw new Error(`Quote response with id: ${quoteResponseProps.quoteId} already exists`)
    }

    const storedObject: any = JSON.parse(JSON.stringify(quoteResponseProps))
    if (quoteResponseProps.error) { storedObject.error = JSON.stringify(storedObject.error) }
    console.log(storedObject)
    const insertedQuoteResponseId = await this._knex<ErrorQuoteResponseProps>('mojaQuotesResponse')
      .insert(storedObject)
      .then(result => result[0])

    const insertedQuoteResponse = await this._knex<ErrorQuoteResponseProps>('mojaQuotesResponse')
      .where('id', insertedQuoteResponseId).first()

    if (!insertedQuoteResponse) {
      throw new Error('Error inserting quote response')
    }
    insertedQuoteResponse.error = JSON.parse(insertedQuoteResponse.error as any)

    console.log(insertedQuoteResponse)

    return insertedQuoteResponse
  }

  async get (quoteId: string): Promise<QuoteResponseProps | undefined> {
    const retrievedQuoteResponses = await this._knex<QuoteResponseProps>('mojaQuotesResponse')
      .where('quoteId', quoteId)
      .where('error', null)
      .first()
    return retrievedQuoteResponses ? {
      ...retrievedQuoteResponses,
      transferAmount: JSON.parse(retrievedQuoteResponses.transferAmount as unknown as string) as Money
    } : undefined
  }

  async getError (quoteId: string): Promise<ErrorQuoteResponse | undefined> {
    const retrievedQuoteResponses = await this._knex<ErrorQuoteResponse>('mojaQuotesResponse')
      .where('quoteId', quoteId)
      .where('transferAmount', null)
      .first()
    return retrievedQuoteResponses ? {
      ...retrievedQuoteResponses,
      error: JSON.parse(retrievedQuoteResponses.error as unknown as string) as ErrorInformation
    } : undefined
  }
}
