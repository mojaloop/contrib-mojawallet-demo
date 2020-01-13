import { AccountsAppContext } from '../index'
import { QuoteResponseTool } from '../services/quoteResponse-service'

export async function quoteResponse (ctx: AccountsAppContext): Promise<void> {
  const { quotes } = ctx
  const { id } = ctx.params
  const { body } = ctx.request
  // TODO: Fire off an error if can't find quote.
  // const retrievedQuote = await quotes.get(id)
  ctx.status = 200
  try {
    const quoteResponseTools = new QuoteResponseTool(body, id)
    await quotes.update(id, {
      quoteResponse: quoteResponseTools.getSerializedResponse()
    })
    quoteResponseTools.initAuthorization()
    return
  } catch (error) {
    console.log(error)
  }
}
