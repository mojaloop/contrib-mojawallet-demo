import { AccountsAppContext } from '../index'
import { QuoteResponseTool } from '../services/quoteResponse-service'

export async function quoteResponse (ctx: AccountsAppContext): Promise<void> {
  const { quotes, mojaloopService } = ctx
  const { id } = ctx.params
  const { body } = ctx.request
  // TODO: Fire off an error if can't find quote.
  const retrievedQuote = await quotes.get(id)
  ctx.status = 200
  if (retrievedQuote) {
    try {
      const transactionRequest = await ctx.transactionRequests.getByTransactionId(retrievedQuote.transactionId)
      const quoteResponseTools = new QuoteResponseTool(body, id)
      await quotes.update(id, {
        quoteResponse: quoteResponseTools.getSerializedResponse()
      })
      if (transactionRequest) {
        mojaloopService.getAuthorization(transactionRequest.transactionRequestId, body.transferAmount)
      }
      return
    } catch (error) {
      console.log(error)
    }
  }
}
