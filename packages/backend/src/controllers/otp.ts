import { AccountsAppContext } from '../index'
import { OtpTools } from '../services/otp-service'

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
