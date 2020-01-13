import { AccountsAppContext } from '../index'
import { QuoteResponseTool } from '../services/quoteResponse-service'

export async function quoteResponse (ctx: AccountsAppContext): Promise<void> {
  const { quotes, mojaloopService } = ctx
  const { id } = ctx.params
  const { body } = ctx.request
  // TODO: Fire off an error if can't find quote.
  const retrievedQuote = await quotes.get(id)
  ctx.logger.info('quoteResponse retrievedQuote', retrievedQuote)
  ctx.status = 200
  if (retrievedQuote) {
    try {
      const transactionRequest = await ctx.transactionRequests.getByTransactionId(retrievedQuote.transactionId)
      ctx.logger.info('quoteResponse transactionRequest', transactionRequest)
      const quoteResponseTools = new QuoteResponseTool(body, id)
      await quotes.update(id, {
        quoteResponse: quoteResponseTools.getSerializedResponse()
      })
      if (transactionRequest) {
        const auth = await mojaloopService.getAuthorization(transactionRequest.transactionRequestId, body.transferAmount)
        ctx.logger.info('quoteResponse auth', auth)
      }
      return
    } catch (error) {
      ctx.logger.error(error)
    }
  }
}
