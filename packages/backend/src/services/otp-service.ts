import Knex = require('knex')

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
}
