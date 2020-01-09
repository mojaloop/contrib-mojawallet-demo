import { AccountsAppContext } from '../index'
// import { QuoteTools } from '../services/quote-service'
// import { mojaResponseService } from '../services/mojaResponseService'
// import { TransactionRequestsPostRequest } from '../types/mojaloop'

export async function create (ctx: AccountsAppContext): Promise<void> {
  ctx.logger.info('Create transaction request called')
  // const { users } = ctx
  // const { transactionRequests, quotes, users } = ctx
  const { body } = ctx.request
  // const payerUserName = (body as TransactionRequestsPostRequest).payer.partyIdentifier

  ctx.logger.info('transactionRequests received body', body)

  // const user = await users.getByUsername(payerUserName)
  // ctx.logger.info(users, 'transactionRequests user')

  // try {
  //   const response = await transactionRequests.create(body, user.id)
  //   ctx.logger.info(response, 'transactionRequests called')

  //   // potentially change to a queing system for asynchronous responses to avoid unhandled promises
  //   mojaResponseService.putResponse(
  //     {
  //       transactionRequestState: 'RECEIVED'
  //     },
  //     body.transactionRequestId
  //   )
  //   ctx.status = 200

  //   const quoteTools = new QuoteTools(body)
  //   await quotes.add(quoteTools.getQuote())
  //   mojaResponseService.quoteResponse(quoteTools.getQuote())
  // } catch (error) {
  //   ctx.logger.error(error, 'Error in transactionRequests')
  //   mojaResponseService.putErrorResponse(
  //     {
  //       errorInformation: {
  //         errorCode: '3100',
  //         errorDescription: 'Invalid transaction request',
  //         extensionList: []
  //       }
  //     },
  //     body.transactionRequestId
  //   )
  //   ctx.status = 400
  // }
}
