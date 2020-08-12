import { AccountsAppContext } from "../../index"
import { MobileMoneyAuthorizationCodeRequest, MobileMoneyAuthorizationCodeResponse } from "../../types/mobile-money"
import { OtpTools } from '../../services/otp-service'

export async function create(ctx: AccountsAppContext) {
  const authorisationCodeRequest = ctx.request.body as MobileMoneyAuthorizationCodeRequest
  const accountId = ctx.params['accountId']
  
  try {
    const account = await ctx.accounts.get(accountId)

    // TODO: account balance checks

    const activeOtp = await ctx.otp.getActiveOtp(account.userId)

    if (activeOtp){
      ctx.response.body = {
        codeState: 'active',
        authorisationCode: activeOtp.otp
      } as MobileMoneyAuthorizationCodeResponse
    } else {
      const otpTools = new OtpTools(account.userId, accountId)
      const otp = otpTools.getOtp()
      console.log('otp', otp)
      await ctx.otp.add(otp)
      ctx.response.body = {
        codeState: 'active',
        authorisationCode: otp.otp
      } as MobileMoneyAuthorizationCodeResponse
    }
    
  } catch (error) {
    ctx.response.status = 404
  }
}
