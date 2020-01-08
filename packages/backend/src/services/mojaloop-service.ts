import Knex from 'knex'
import { MojaloopRequests, PostTransferBody } from '@mojaloop/sdk-standard-components'
import { KnexOtpService } from './otp-service'
import { StoredRequest } from './transaction-request-service'

export interface MojaloopService {
  getAuthorization: (transactionRequestId: string) => Promise<void>
  validateTransactionOTP: (transactionRequestId: string, OTP: string) => Promise<boolean>
  initiateTransfer: (transactionRequestId: string) => Promise<void>
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
  async getAuthorization (transactionRequestId: string): Promise<void> {
    return Promise.resolve()
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

  async initiateTransfer (transactionRequestId: string): Promise<void> {
    // Get the quote object first based on transferId?
    const transferBody: PostTransferBody = {
      amount: {
        amount: '',
        currency: ''
      },
      condition: '',
      expiration: '',
      ilpPacket: '',
      payeeFsp: '',
      payerFsp: '',
      transferId: ''
    }

    await this._mojaloopRequests.postTransfers(transferBody, transferBody.payerFsp)
  }
}
