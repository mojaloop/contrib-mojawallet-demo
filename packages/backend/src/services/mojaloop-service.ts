import Knex from 'knex'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import { KnexOtpService } from './otp-service'
import { StoredRequest } from './transaction-request-service'
import axios, { AxiosResponse } from 'axios'
import { Money, TransfersPostRequest } from '../types/mojaloop'

const baseMojaUrl: string = process.env.PUT_BASE_URI || 'http://localhost:8008'

export type StoredTransfer = {
  transferId: string
  transactionId: string
  transactionRequestId: string
  quoteId: string
  response?: string
  error?: string
}

export interface MojaloopService {
  getAuthorization: (transactionRequestId: string, transferAmount: Money) => Promise<AxiosResponse>
  validateTransactionOTP: (transactionRequestId: string, OTP: string) => Promise<boolean>
  initiateTransfer: (transferBody: TransfersPostRequest, storedTransfer: StoredTransfer) => Promise<void>
}

export class KnexMojaloopService implements MojaloopService {
  private _knex: Knex
  private _mojaloopRequests: MojaloopRequests
  private _otpService: KnexOtpService

  constructor (knex: Knex, mojaloopRequests: MojaloopRequests, otpService: KnexOtpService) {
    this._knex = knex
    this._mojaloopRequests = mojaloopRequests
    this._otpService = otpService
  }

  // Initiate the GET request to the Mojaloop Switch
  async getAuthorization (transactionRequestId: string, transferAmount: Money): Promise<AxiosResponse> {
    const url = new URL(`/authorizations/${transactionRequestId}?authenticationType=OTP&retriesLeft=1&amount=${transferAmount.amount}&currency=${transferAmount.currency}`, baseMojaUrl)
    return axios.get(url.toString(), {
      headers: {
        'fspiop-source': 'mojawallet',
        'fspiop-destination': 'adaptor',
        'Content-Type': 'application/vnd.interoperability.authorizations+json;version=1.0'
      },
      timeout: 5000
    }).then(resp => resp.data)
  }

  async validateTransactionOTP (transactionRequestId: string, OTP: string): Promise<boolean> {
    const transactionRequest = await this._knex<StoredRequest>('mojaTransactionRequest')
      .where({ transactionRequestId })
      .first()

    if (transactionRequest) {
      const validOtp = await this._otpService.getActiveOtp(transactionRequest.userId.toString())

      if (validOtp) {
        return validOtp.otp === OTP
      }
    }

    return false
  }

  async initiateTransfer (transferBody: TransfersPostRequest, storedTransfer: StoredTransfer): Promise<void> {
    await this._knex<StoredTransfer>('transfers').insert(storedTransfer)
    // TODO Remove funds from the users account.
    await this._mojaloopRequests.postTransfers(transferBody, transferBody.payerFsp)
  }
}
