import { AccountsAppContext } from '../index'

export async function transfersErrors (ctx: AccountsAppContext): Promise<void> {
  const { id } = ctx.params
  const { body } = ctx.request

  ctx.logger.error(`Transfer error with details: ${id}: ${body}`)
  // TODO Need to perform a reverse transfer to give the person their money back.
  ctx.status = 200
}
