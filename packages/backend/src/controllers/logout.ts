import { Context } from 'koa'
import { hydraApi } from '../apis/hydra'

export async function store (ctx: Context): Promise<void> {
  const challenge = ctx.request.query.logout_challenge

  const acceptLogout = await hydraApi.acceptLogoutRequest(challenge).catch((error: any) => {
    ctx.logger.error(error, 'error in accept login request')
    throw error
  })

  ctx.body = {
    redirectTo: acceptLogout['redirect_to']
  }
}
