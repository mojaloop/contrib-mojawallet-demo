import { AccountsAppContext } from '../index'
import { QuoteTools } from '../services/quote-service'
import { mojaResponseService } from '../services/mojaResponseService'
import { TransactionRequestsPostRequest } from '../types/mojaloop'

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { transactionRequests, quotes, users, mojaloopRequests } = ctx
  const { body } = ctx.request
  const destFspId = ctx.get('fspiop-source')
  const payerUserName = (body as TransactionRequestsPostRequest).payer.partyIdentifier

  const user = await users.getByUsername(payerUserName)
  ctx.status = 200
  let transactionId
  try {
    transactionId = await transactionRequests.create(body, user.id)
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
    ctx.logger.error(error, 'Error in transactionRequests')
    mojaResponseService.putErrorResponse(
      {
        errorInformation: {
          errorCode: '3100',
          errorDescription: 'Invalid transaction request',
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
