import { AccountsAppContext } from '../index'

export async function transfersResponse (ctx: AccountsAppContext): Promise<void> {
  const { id } = ctx.params
  const { body } = ctx.request

  ctx.logger.info(`Transfer success with details: ${id}: ${body}`)
  ctx.status = 200
}
