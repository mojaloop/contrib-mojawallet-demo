import { AccountsAppContext } from '../index'
import { QuoteResponseTool } from '../services/quoteResponse-service'

export async function quoteResponse (ctx: AccountsAppContext): Promise<void> {
  const { quotes, mojaloopService, quotesResponse } = ctx
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
      await quotesResponse.store(quoteResponseTools.getQuoteResponseProps())
      if (transactionRequest) {
        const query = `authenticationType=OTP&retriesLeft=1&amount=${body.transferAmount.amount}&currency=${body.transferAmount.currency}`
        ctx.logger.info('requesting auth', query)
        const auth = await ctx.mojaloopRequests.getAuthorizations(transactionRequest.transactionRequestId, query, ctx.request.headers['fspiop-source'])
        ctx.logger.info('quoteResponse auth', auth)
      }
      return
    } catch (error) {
      ctx.logger.error(error)
    }
  }
}
