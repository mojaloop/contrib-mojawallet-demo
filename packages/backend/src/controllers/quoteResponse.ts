import { AccountsAppContext } from '../index'
import { QuoteResponseTool } from '../services/quoteResponse-service'

export async function quoteResponse (ctx: AccountsAppContext): Promise<void> {
  const { quotes } = ctx
  const { id } = ctx.params
  const { body } = ctx.request
  const retrievedQuote = await quotes.get(id)

  if (!retrievedQuote) {
    ctx.status = 404
  } else {
    try {
      const quoteResponseTools = new QuoteResponseTool(body, id)
      await quotes.update(id, {
        quoteResponse: quoteResponseTools.getSerializedResponse()
      })
      quoteResponseTools.initAuthorization()
      ctx.status = 200
      return
    } catch (error) {
      console.log(error)
      ctx.status = 400
    }
  }
}
