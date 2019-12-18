import { Money, DateTime, GeoCode, ExtensionList } from './transaction-request-service'
import Joi from 'joi'
import { authorizeQuote } from './authorization-service'

export type QuoteResponse = {
  transferAmount: Money;
  payeeReceiveAmount?: Money;
  payeeFspFee?: Money;
  payeeFspComission?: Money;
  expiration: DateTime;
  geoCode?: GeoCode;
  ilpPacket: string;
  condition: string;
  extensionList?: ExtensionList;
}

export class QuoteResponseTool {
  private _quoteResponse: QuoteResponse
  private _quoteId: string

  constructor (quoteResponse: QuoteResponse, quoteId: string) {
    this._quoteResponse = quoteResponse
    this._quoteId = quoteId
    if (!this.isValidQuoteResponse(quoteResponse)) {
      throw new Error('Bad quote response')
    }
  }

  private isValidQuoteResponse (quoteResponse: QuoteResponse): boolean {
    const moneySchema = Joi.object({
      currency: Joi.string().regex(/^[A-Z]{3}/).required(),
      amount: Joi.string().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).required()
    })

    const dateTimeSchema = Joi.string().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468\][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/)

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
      expiration: dateTimeSchema.required(),
      geoCode: geoCodeSchema,
      ilpPacket: ilpPacketSchema.required(),
      condition: ilpConditionSchema.required(),
      extensionList: extensionListSchema
    })

    if (Joi.validate(quoteResponse, quoteResponseSchema).error) {
      return false
    } else {
      return true
    }
  }

  initAuthorization () {
    authorizeQuote(this._quoteId)
  }

  getSerializedResponse (): string {
    return (JSON.stringify(this._quoteResponse))
  }
}
