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

import { AccountsAppContext } from '../index'
import { OtpTools, OtpProps } from '../services/otp-service'

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { otp, accounts } = ctx
  const { body } = ctx.request
  const userId = ctx.state.user.sub

  try {
    const account = await accounts.get(body.accountId)

    // check if account exists and is owned by user
    if (body.accountId && account && account.userId === userId) {
      const activeOtp = await otp.getActiveOtp(userId)
      // check if there is an active otp
      if (!activeOtp) {
        const otpTools = new OtpTools(userId, body.accountId)
        otp.add(otpTools.getOtp())
        ctx.body = otpTools.getOtp()
        ctx.status = 200
      } else {
        ctx.body = 'An active otp already exists for this user'
        ctx.status = 409
      }
    } else {
      throw new Error('Account does not exist')
    }
  } catch (error) {
    ctx.status = 400
  }
}

export async function fetch (ctx: AccountsAppContext): Promise<void> {
  const { otp } = ctx
  const userId = ctx.state.user.sub

  const activeOtp = await otp.getActiveOtp(userId)
  if (activeOtp) {
    ctx.body = activeOtp
    ctx.status = 200
  } else {
    ctx.body = 'No active otps for this account'
    ctx.status = 404
  }
}

export async function cancel (ctx: AccountsAppContext): Promise<void> {
  const { otp } = ctx
  const userId = ctx.state.user.sub

  const activeOtp = await otp.getActiveOtp(userId)

  if (activeOtp) {
    const otpProps: OtpProps = {
      userId,
      isUsed: activeOtp.isUsed,
      expiresAt: Date.now() / 1000
    }
    otp.update(otpProps)
    ctx.status = 200
  } else {
    ctx.body = 'No active otp for this account'
    ctx.status = 404
  }
}
