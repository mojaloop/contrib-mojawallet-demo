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

import Knex = require('knex')

export type OtpProps = {
  userId: string,
  expiresAt: number,
  isUsed: boolean
}

export type Otp = {
  userId: string,
  accountId: string;
  expiresAt: number;
  isUsed: boolean;
  otp: string;
}

export class OtpTools {
  private _otpObject: Otp
  constructor (userId: string, accountId: string) {
    this._otpObject = {
      userId,
      accountId,
      expiresAt: this.genExpiry(),
      isUsed: false,
      otp: this.genOtp()
    }
  }

  private genOtp (): string {
    let strOtp = Math.floor(Math.random() * 10000).toString()
    while (strOtp.length < 4) {
      strOtp = '0' + strOtp
    }
    return (strOtp)
  }

  private genExpiry (): number {
    const expiry = Math.floor(((new Date(Date.now() + (1000 * 60 * 5))).getTime()) / 1000)
    return (expiry)
  }

  getOtp (): Otp {
    return (this._otpObject)
  }
}

export class KnexOtpService {
  private _knex: Knex
  constructor (knex: Knex) {
    this._knex = knex
  }

  async add (otpObject: Otp): Promise<Otp> {
    const insertedOtp = await this._knex<Otp>('mojaOtp').insert(otpObject).returning(['userId', 'accountId', 'expiresAt', 'isUsed', 'otp'])
    return (insertedOtp[0])
  }

  async get (userId: string): Promise<Otp[]> {
    const retrievedOtps = await this._knex<Otp>('mojaOtp')
      .where({ userId })
    return (retrievedOtps)
  }

  async getActiveOtp (userId: string): Promise<Otp | undefined> {
    const retrievedOtp = await this._knex<Otp>('mojaOtp')
      .where({
        userId,
        isUsed: false
      })
      .andWhere('expiresAt', '>', Math.floor(Date.now() / 1000))
      .first()
    return (retrievedOtp)
  }

  async update (otpProps: OtpProps): Promise<void> {
    await this._knex<Otp>('mojaOtp')
      .where({ userId: otpProps.userId })
      .update({
        isUsed: otpProps.isUsed,
        expiresAt: otpProps.expiresAt
      })
  }

  async markUsed (userId: string): Promise<number> {
    const retrievedOtp = await this._knex<Otp>('mojaOtp')
      .where({
        userId,
        isUsed: false
      })
      .andWhere('expiresAt', '>', Math.floor(Date.now() / 1000))
      .first()
      .update({
        isUsed: true
      })
    return (retrievedOtp)
  }
}
