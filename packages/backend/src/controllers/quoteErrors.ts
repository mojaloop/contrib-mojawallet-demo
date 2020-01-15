import { AccountsAppContext } from '../index'
import { ErrorQuoteResponseTool } from '../services/quoteResponse-service'

export async function store (ctx: AccountsAppContext): Promise<void> {
  const { logger, quotesResponse } = ctx
  const { id } = ctx.params
  const { body } = ctx.request

  const errorQuoteResponseTool = new ErrorQuoteResponseTool(body, id)
  await quotesResponse.store(errorQuoteResponseTool.getQuoteResponseProps())
  logger.info('Received Quote Error Response', { quoteId: id, body })
  ctx.status = 200
}
