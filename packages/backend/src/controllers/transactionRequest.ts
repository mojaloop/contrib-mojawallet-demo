import { AccountsAppContext } from '../index'
import { QuoteTools } from '../services/quote-service'
import { mojaResponseService } from '../services/mojaResponseService'
import { TransactionRequestsPostRequest } from '../types/mojaloop'

export async function create (ctx: AccountsAppContext): Promise<void> {
  ctx.logger.info('Create transaction request called')
  const { transactionRequests, quotes, users } = ctx
  const { body } = ctx.request
  const destFspId = ctx.get('fspiop-source')
  const payerUserName = (body as TransactionRequestsPostRequest).payer.partyIdentifier

  ctx.logger.info('transactionRequests received body', body)

  const user = await users.getByUsername(payerUserName)
  ctx.logger.info(user, 'transactionRequests user')

  try {
    const response = await transactionRequests.create(body, user.id)
    ctx.logger.info('transactionRequests called', response)

    // potentially change to a queing system for asynchronous responses to avoid unhandled promises
    const resp = await mojaResponseService.putResponse(
      {
        transactionRequestState: 'RECEIVED'
      },
      body.transactionRequestId,
      destFspId
    )
    ctx.logger.info('mojaResponseService putResponse', resp)
    ctx.status = 200

    const quoteTools = new QuoteTools(body)
    await quotes.add(quoteTools.getQuote())
    mojaResponseService.quoteResponse(quoteTools.getQuote(), destFspId)
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
    ctx.status = 200
  }
}
