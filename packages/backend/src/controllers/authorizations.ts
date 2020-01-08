import { AccountsAppContext } from '../index'

export async function authorizations (ctx: AccountsAppContext): Promise<void> {
  const { transactionRequests, mojaloopService } = ctx
  const { id } = ctx.params
  const { body } = ctx.request

  const transactionRequest = await transactionRequests.getByRequestId(id)

  if (transactionRequest) {
    // TODO Validate authorization
    const isValid = await mojaloopService.validateTransactionOTP(transactionRequest.transactionRequestId, body.authenticationInfo.authenticationValue)

    // TODO Begin Transfer if Valid OTP else fail
    if (isValid) {
      await mojaloopService.initiateTransfer(transactionRequest.transactionRequestId)
    }
  }

  ctx.status = 200
}
