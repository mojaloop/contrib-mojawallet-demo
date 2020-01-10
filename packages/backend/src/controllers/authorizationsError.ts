import { AccountsAppContext } from '../index'

export async function errorCallback (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  logger.info(`Authorization for ${ctx.params.id} failed`, ctx.request.body)
  ctx.status = 200
}
