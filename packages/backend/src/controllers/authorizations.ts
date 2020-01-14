import { AccountsAppContext } from '../index'
import { TransfersPostRequest } from '../types/mojaloop'
import { QuoteResponse } from '../services/quoteResponse-service'
import { StoredTransfer } from '../services/mojaloop-service'
import uuidv4 = require('uuid/v4')

export async function authorizations (ctx: AccountsAppContext): Promise<void> {
  const { transactionRequests, mojaloopService, quotes, otp, transactions } = ctx
  const { id } = ctx.params
  const { body } = ctx.request

  const payeeFsp = ctx.get('fspiop-destination')
  const payerFsp = ctx.get('fspiop-source')
  console.log('payeeFsp', payeeFsp)
  console.log('payerFsp', payerFsp)
  try {
    const transactionRequest = await transactionRequests.getByRequestId(id)
    console.log('transactionRequest', transactionRequest)
    if (transactionRequest) {
      const quote = await quotes.getByTransactionId(transactionRequest.transactionId)
      console.log('quote', quote)
      const storedOtp = await otp.getActiveOtp(transactionRequest.userId.toString())
      console.log('storedOtp', storedOtp)
      if (quote && storedOtp && quote.quoteResponse) {
        const quoteResponse: QuoteResponse = JSON.parse(quote.quoteResponse)
        console.log('quoteResponse', quoteResponse)
        const transferId = uuidv4()
        const isValid = await mojaloopService.validateTransactionOTP(transactionRequest.transactionRequestId, body.authenticationInfo.authenticationValue)
        console.log('isValid', isValid)
        if (isValid && quoteResponse) {
          const transferBody: TransfersPostRequest = {
            amount: quoteResponse.transferAmount,
            condition: quoteResponse.condition,
            expiration: quoteResponse.expiration,
            ilpPacket: quoteResponse.ilpPacket,
            payeeFsp: payeeFsp,
            payerFsp: payerFsp,
            transferId: transferId
          }
          const transfer: StoredTransfer = {
            transferId: transferId,
            transactionId: transactionRequest.transactionId,
            transactionRequestId: transactionRequest.transactionRequestId,
            quoteId: quote.quoteId as string
          }
          await otp.markUsed(transactionRequest.userId.toString())
          await transactions.create(storedOtp.accountId, BigInt(quoteResponse.transferAmount.amount))
          await mojaloopService.initiateTransfer(transferBody, transfer)
        }
      }
    }
  } catch (error) {
    console.log(error)
  }

  ctx.status = 200
}
