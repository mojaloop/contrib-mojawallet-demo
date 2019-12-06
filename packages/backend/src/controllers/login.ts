import bcrypt from 'bcrypt'
import { User } from '../services/user-service'
import { Config, Joi } from 'koa-joi-router'
import { hydraApi } from '../apis/hydra'
import { AccountsAppContext } from '..'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const challenge = ctx.request.query.login_challenge
  ctx.logger.debug('Get login request', { challenge })
  const loginRequest = await hydraApi.getLoginRequest(challenge).catch(error => {
    ctx.logger.error(error, 'error in login request')
    throw error
  })

  if (loginRequest['skip']) {
    const acceptLogin = await hydraApi.acceptLoginRequest(challenge, { subject: loginRequest['subject'],
      remember: true,
      remember_for: 604800 // 1 week
    }).catch(error => {
      ctx.logger.error(error, 'error in accept login request')
      throw error
    })
    ctx.status = 200
    ctx.body = { redirectTo: acceptLogin['redirect_to'] }
    return
  }

  ctx.status = 200
  ctx.body = { redirectTo: null }
}
export async function store (ctx: AccountsAppContext): Promise<void> {
  const { users } = ctx
  const { username, password } = ctx.request.body
  const challenge = ctx.request.query.login_challenge
  ctx.logger.debug('Post login request', { username: username, challenge })
  let user: User
  try {
    user = await users.getByUsername(username)
    ctx.assert(user, 401, 'Invalid username or password.')
    ctx.logger.debug(`Creating user ${user}`)
    ctx.body = {
      ...user
    }
  } catch (error) {
    ctx.throw(400, error)
  }
  ctx.assert(await bcrypt.compare(password, user!.password), 401, 'Invalid username or password.')
  const acceptLogin = await hydraApi.acceptLoginRequest(challenge, {
    subject: user!.id.toString(),
    remember: true,
    remember_for: 604800 // 1 week
  }).catch(error => {
    ctx.logger.error(error, 'error in accept login request')
    throw error
  })

  ctx.body = {
    redirectTo: acceptLogin['redirect_to']
  }
}

export function createValidation (): Config {
  return {
    validate: {
      type: 'json',
      query: {
        login_challenge: Joi.string().required().error(new Error('login_challenge is required.'))
      },
      body: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
      })
    }
  }
}

export function getValidation (): Config {
  return {
    validate: {
      query: {
        login_challenge: Joi.string().required().error(new Error('login_challenge is required.'))
      }
    }
  }
}
