/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Cairin Michie <cairin@coil.com>
- Donovan Changfoot <don@coil.com>
- Matthew de Haast <matt@coil.com>
- Talon Patterson <talon.patterson@coil.com>
*****/

import Knex from 'knex'
import { MojaloopRequests } from '@mojaloop/sdk-standard-components'
import { KnexOtpService } from './otp-service'
import { StoredTransactionRequest } from './transaction-request-service'
import axios, { AxiosResponse } from 'axios'
import { Money, TransfersPostRequest } from '../types/mojaloop'

export type StoredTransfer = {
  transferId: string
  transactionId: string
  transactionRequestId: string
  quoteId: string
  response?: string
  error?: string
  accountId: string
  isReverted: boolean
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
    const url = new URL(`/authorizations/${transactionRequestId}?authenticationType=OTP&retriesLeft=1&amount=${transferAmount.amount}&currency=${transferAmount.currency}`, 'https://transaction-request-service.mojaloop.app')
    return axios.get(url.toString(), {
      headers: {
        'fspiop-source': 'mojawallet',
        'fspiop-destination': 'adaptor',
        'Content-Type': 'application/vnd.interoperability.authorizations+json;version=1.0',
        'accept': 'application/vnd.interoperability.authorizations+json;version=1.0'
      },
      timeout: 5000
    }).then(resp => resp.data)
  }

  async validateTransactionOTP (transactionRequestId: string, OTP: string): Promise<boolean> {
    const transactionRequest = await this._knex<StoredTransactionRequest>('mojaTransactionRequest')
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
