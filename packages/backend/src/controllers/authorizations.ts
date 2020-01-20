import { AccountsAppContext } from '../index'
import { TransfersPostRequest } from '../types/mojaloop'
// import { QuoteResponse } from '../services/quoteResponse-service'
import { StoredTransfer } from '../services/mojaloop-service'
import uuidv4 = require('uuid/v4')

const toBigInt = (value: string, scale: number): bigint => {
  const floatValue = parseFloat(value)
  const intValue = (floatValue * 10 ** (scale)).toFixed(0)
  return BigInt(intValue)
}

export async function authorizations (ctx: AccountsAppContext): Promise<void> {
  const { transactionRequests, mojaloopService, quotes, otp, transactions, quotesResponse, pusher } = ctx
  const { id } = ctx.params
  const { body } = ctx.request

  const payerFsp = ctx.get('fspiop-destination')
  const payeeFsp = ctx.get('fspiop-source')
  try {
    const transactionRequest = await transactionRequests.getByRequestId(id)
    if (transactionRequest) {
      const quote = await quotes.getByTransactionId(transactionRequest.transactionId)
      const storedOtp = await otp.getActiveOtp(transactionRequest.userId.toString())
      if (quote && storedOtp) {
        const quoteResponse = await quotesResponse.get(quote.quoteId)
        const transferId = uuidv4()
        const isValid = await mojaloopService.validateTransactionOTP(transactionRequest.transactionRequestId, body.authenticationInfo.authenticationValue)
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
            quoteId: quote.quoteId as string,
            accountId: storedOtp.accountId,
            isReverted: false
          }
          await otp.markUsed(transactionRequest.userId.toString())
          const bigInt = toBigInt(quoteResponse.transferAmount.amount, 2)
          await transactions.create(storedOtp.accountId, bigInt)
          await pusher.trigger({
            channel: `account-${storedOtp.accountId}`,
            name: 'transaction',
            data: {
              message: bigInt.toString()
            }
          })
          await mojaloopService.initiateTransfer(transferBody, transfer)
        }
      }
    }
  } catch (error) {
    console.log(error)
  }

  ctx.status = 200
}
