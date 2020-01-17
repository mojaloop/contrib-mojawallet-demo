import { AccountsAppContext } from '../index'
import { QuoteTools } from '../services/quote-service'
import { mojaResponseService } from '../services/mojaResponseService'
import { TransactionRequestsPostRequest } from '../types/mojaloop'
import { User } from '../services/user-service'

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { transactionRequests, quotes, users, mojaloopRequests, otp, accounts } = ctx
  const { body } = ctx.request
  const destFspId = ctx.get('fspiop-source')
  const payerUserName = (body as TransactionRequestsPostRequest).payer.partyIdentifier

  ctx.status = 202
  let transactionId
  try {
    let user: User
    try {
      user = await users.getByUsername('+' + payerUserName)
    } catch (error) {
      throw new Error('3204')
    }
    try {
      transactionId = await transactionRequests.create(body, user.id)
    } catch (error) {
      throw new Error('3100')
    }
    const activeOtp = await otp.getActiveOtp(user.id.toString())
    if (activeOtp) {
      const account = await accounts.get(activeOtp.accountId)
      // currency is not taken into account when checking available funds
      if (account.balance < (parseInt(transactionId.amount.amount) * 100)) {
        throw new Error('4000')
      }
    } else {
      throw new Error('4000')
    }
    // potentially change to a queing system for asynchronous responses to avoid unhandled promises
    await mojaResponseService.putResponse(
      {
        transactionRequestState: 'RECEIVED',
        transactionId: transactionId.transactionId
      },
      body.transactionRequestId,
      destFspId
    )
  } catch (error) {
    let errorCode
    let errorDescription
    if (error.message === '3204') {
      errorCode = '3204'
      errorDescription = 'Party not found'
    } else if (error.message === '4000') {
      errorCode = '4000'
      errorDescription = 'Payer error, unable to complete transaction request'
    } else {
      errorCode = '3100'
      errorDescription = 'Invalid transaction request'
    }
    ctx.logger.error(error, 'Error in transactionRequests')
    await mojaResponseService.putErrorResponse(
      {
        errorInformation: {
          errorCode,
          errorDescription,
          extensionList: []
        }
      },
      body.transactionRequestId,
      destFspId
    )
  }
  if (transactionId) {
    try {
      ctx.logger.info('Quote flow started.')
      await sleep(100)
      const quoteTools = new QuoteTools(body, transactionId.transactionId)
      const quoteResponse = await quotes.add(quoteTools.getQuote())
      ctx.logger.info('quoteResponse received body', quoteResponse)
      const postQuotes = await mojaloopRequests.postQuotes(quoteTools.getQuote(), destFspId)
      ctx.logger.info('postQuotes received body', postQuotes)
    } catch (error) {
      ctx.logger.error(error, 'Error in transactionRequests')
    }
  }
}
