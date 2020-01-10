import { AccountsAppContext } from '../index'

export async function store (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  const { id } = ctx.params
  const { body } = ctx.request

  logger.info('Received Quote Error Response', { quoteId: id, body })
  ctx.status = 200
}
