import Joi, { ValidationResult } from 'joi'
import Knex from 'knex'
import { TransactionRequestsPostRequest } from '../types/mojaloop'
import uuidv4 = require('uuid/v4')

export type RequestId = string;
export type AuthenticationType = 'OTP' | 'QRCODE';
export type MojaExtension = {
  extensionKey: string;
  extensionValue: string;
}
export type ExtensionList = MojaExtension[];

export type StoredRequest = {
  id: number;
  transactionId: string;
  transactionRequestId: string;
  serializedRequest: string;
  valid: boolean;
  userId: number;
}

export class TransactionRequestTools {
  private _valid: boolean
  private _transactionRequest: TransactionRequestsPostRequest

  constructor (postedObject: object) {
    if (this.isValid(postedObject).error) {
      console.log(this.isValid(postedObject).error)
      this._valid = false
    } else {
      this._transactionRequest = postedObject as TransactionRequestsPostRequest
      this._valid = true
    }
  }

  private isValid (untestedOb: object): ValidationResult<object> {
    const uuidSchema = Joi.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)

    const partyIdInfoSchema = Joi.object({
      partyIdType: Joi.string().valid('MSISDN', 'EMAIL', 'PERSONAL_ID', 'BUSINESS', 'DEVICE', 'ACCOUNT_ID', 'IBAN', 'ALIAS').required(),
      partyIdentifier: Joi.string().min(1).max(128).required(),
      partySubIdOrType: Joi.string().min(1).max(128),
      fspId: Joi.string().min(1).max(32)
    }).required()

    const partySchema = Joi.object({
      partyIdInfo: partyIdInfoSchema,
      merchantClassificationCode: Joi.string().regex(/^[\d]{1,4}$/),
      name: Joi.string().regex(/^(?!\s*$)[\w .,'-]{1,128}$/),
      personalInfo: {
        complexName: {
          firstName: Joi.string().regex(/^(?!\s*$)[\w .,'-]{1,128}$/),
          middleName: Joi.string().regex(/^(?!\s*$)[\w .,'-]{1,128}$/),
          lastName: Joi.string().regex(/^(?!\s*$)[\w .,'-]{1,128}$/)
        },
        dateOfBirth: Joi.string().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)$/)
      }
    })

    const moneySchema = Joi.object({
      currency: Joi.string().regex(/^[A-Z]{3}/).required(),
      amount: Joi.string().regex(/^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$/).required()
    })

    const transactionTypeSchema = Joi.object({
      scenario: Joi.string().valid('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND').required(),
      subScenario: Joi.alternatives(Joi.string(), Joi.number()),
      initiator: Joi.string().valid('PAYER', 'PAYEE').required(),
      initiatorType: Joi.string().valid('CONSUMER', 'AGENT', 'BUSINESS', 'DEVICE').required(),
      refundInfo: {
        originalTransactionId: uuidSchema.required(),
        refundReason: Joi.string().max(128)
      },
      balanceOfPayments: Joi.string().regex(/^[1-9]\d{2}$/)
    })

    const noteSchema = Joi.string().max(128)

    const geoCodeSchema = Joi.object({
      latitude: Joi.string().regex(/^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/).required(),
      longitude: Joi.string().regex(/^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$/).required()
    })

    const authenticationTypeSchema = Joi.string().valid('OTP', 'QRCODE')

    const dateTimeSchema = Joi.string().regex(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468\][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:(\.\d{3}))(?:Z|[+-][01]\d:[0-5]\d)$/)

    const extensionListSchema = Joi.array().length(16).items(Joi.object({
      extensionKey: Joi.string().max(32).required(),
      extensionVAlue: Joi.string().max(128).required()
    }))

    const requestSchema = Joi.object({
      transactionRequestId: Joi.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/).required(),
      payee: partySchema.required(),
      payer: partyIdInfoSchema.required(),
      amount: moneySchema.required(),
      transactionType: transactionTypeSchema.required(),
      note: noteSchema,
      geoCode: geoCodeSchema,
      authenticationType: authenticationTypeSchema,
      expiration: dateTimeSchema,
      extensionList: extensionListSchema
    })

    return (Joi.validate(untestedOb, requestSchema))
  }

  getValidStatus (): boolean {
    return (this._valid)
  }

  getSerializedRequest (): string {
    try {
      return (JSON.stringify(this._transactionRequest))
    } catch (error) {
      throw new Error('Invalid request')
    }
  }

  getRequestId (): string {
    try {
      return (this._transactionRequest.transactionRequestId)
    } catch (error) {
      throw new Error('Invalid request')
    }
  }
}

export class KnexTransactionRequestService {
  private _knex: Knex
  constructor (knex: Knex) {
    this._knex = knex
  }

  async create (transactionRequest: TransactionRequestsPostRequest, userId: number): Promise<StoredRequest> {
    const transactionRequestTools = new TransactionRequestTools(transactionRequest)

    const insertedRequest = await this._knex<StoredRequest>('mojaTransactionRequest').insert({
      transactionId: uuidv4(),
      transactionRequestId: transactionRequestTools.getRequestId(),
      serializedRequest: transactionRequestTools.getSerializedRequest(),
      valid: transactionRequestTools.getValidStatus(),
      userId
    }).then((ids) => {
      return this._knex<StoredRequest>('mojaTransactionRequest').where('id', ids[0]).first()
    }) // returning not supported by sqlite3

    if (!insertedRequest) {
      throw new Error('Inserted request returned null')
    }
    return (insertedRequest)
  }

  async getByRequestId (requestId: string): Promise<StoredRequest | undefined> {
    const retrievedRequest = await this._knex<StoredRequest>('mojaTransactionRequest')
      .where({ transactionrequestId: requestId })
      .first()
    return (retrievedRequest)
  }

  async getByTransactionId (id: string): Promise<StoredRequest | undefined> {
    const retrievedRequest = await this._knex<StoredRequest>('mojaTransactionRequest')
      .where({ transactionId: id })
      .first()
    return (retrievedRequest)
  }
}
