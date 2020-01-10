import { AccountsAppContext } from '../index'

export async function successCallback (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  logger.info('sending to participants successful', ctx.body)
  ctx.status = 200
}

export async function errorCallback (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  logger.info('Sending to participants failed', ctx.body)
  ctx.status = 200
}
