import { AccountsAppContext } from '../index'
import { TransfersPostRequest, AuthorizationsIDPutResponse } from '../types/mojaloop'
// import { QuoteResponse } from '../services/quoteResponse-service'
import { StoredTransfer } from '../services/mojaloop-service'
import uuidv4 = require('uuid/v4')
import got from 'got/dist/source'

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
            expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
          const bigInt = toBigInt(quoteResponse.transferAmount.amount, 2) * BigInt(-1)
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

export async function show (ctx: AccountsAppContext) {
  const transactionRequestId = ctx.params['transactionRequestId']

  try {
    const mobileMoneyTransaction = await ctx.mobileMoneyTransactions.get(transactionRequestId)
    if (!mobileMoneyTransaction.oneTimeCode) {
      ctx.mojaloopRequests.putAuthorizations(transactionRequestId, { responseType: 'REJECTED' } as AuthorizationsIDPutResponse, ctx.request.headers['fspiop-source'])
      return
    }

    // await ctx.mojaloopRequests.putAuthorizations(transactionRequestId, { responseType: 'ENTERED', authenticationInfo: { authenticationValue: mobileMoneyTransaction.oneTimeCode, authentication: 'OTP' } } as AuthorizationsIDPutResponse, ctx.request.headers['fspiop-source'])
    const authResponse: AuthorizationsIDPutResponse = { responseType: 'ENTERED', authenticationInfo: { authenticationValue: mobileMoneyTransaction.oneTimeCode, authentication: 'OTP' } } 
    await got.put('https://transaction-request-service.mojaloop.app/authorizations/' + transactionRequestId, { json: authResponse,
      headers: {
        'Content-Type': 'application/vnd.interoperability.authorizations+json;version=1.0',
        'Accept': 'application/vnd.interoperability.authorizations+json;version=1.0',
        'FSPIOP-Source': 'mojawallet',
        'FSPIOP-Destination': ctx.request.headers['fspiop-source'],
        'Date': new Date().toUTCString()
      }
    })
    ctx.response.status = 200
  } catch (error) {
    console.log('error', error)
    ctx.logger.error('Could not find mobile money transaction associated to mojaloop transaction request')
    ctx.response.status = 404
  }

}
