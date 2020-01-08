import { AccountsAppContext } from '../index'
import { QuoteTools } from '../services/quote-service'
import { mojaResponseService } from '../services/mojaResponseService'
import { TransactionRequest } from '../services/transaction-request-service'

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { transactionRequests, quotes, users } = ctx
  const { body } = ctx.request
  const payerUserName = (body as TransactionRequest).payer.partyIdInfo.partyIdentifier

  const user = await users.getByUsername(payerUserName)

  try {
    await transactionRequests.create(body, user.id)

    // potentially change to a queing system for asynchronous responses to avoid unhandled promises
    mojaResponseService.putResponse(
      {
        transactionRequestState: 'RECEIVED'
      },
      body.transactionRequestId
    )
    ctx.status = 200

    const quoteTools = new QuoteTools(body)
    await quotes.add(quoteTools.getQuote())
    mojaResponseService.quoteResponse(quoteTools.getQuote())
  } catch (error) {
    mojaResponseService.putErrorResponse(
      {
        errorInformation: {
          errorCode: '3100',
          errorDescription: 'Invalid transaction request',
          extensionList: []
        }
      },
      body.transactionRequestId
    )
    ctx.status = 400
  }
}
