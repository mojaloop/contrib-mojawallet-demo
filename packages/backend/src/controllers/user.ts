import bcrypt from 'bcrypt'
import { Config, Joi } from 'koa-joi-router'
import { AccountsAppContext } from '..'
import { UserProps, User } from '../services/user-service'
import { parseNumber, isValidNumber } from 'libphonenumber-js'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const { users } = ctx
  ctx.logger.debug('Get me request')
  ctx.assert(ctx.state.user && ctx.state.user.sub, 401)
  let user: User
  try {
    user = await users.getById(ctx.state.user.sub)
    ctx.assert(user, 404, 'User not found.')
    ctx.body = {
      ...user
    }
  } catch (error) {
    ctx.throw(400, error)
  }
}

export async function store (ctx: AccountsAppContext): Promise<void> {
  const { users } = ctx
  const { username, password } = ctx.request.body
  ctx.logger.debug(`Creating user ${username}`)
  ctx.assert(username != null, 400, '"username" is required')
  ctx.assert(password != null, 400, '"password" is required')
  const salt = await bcrypt.genSalt()
  const hashedPassword = bcrypt.hashSync(password, salt)

  const userProps: UserProps = {
    username: username,
    password: hashedPassword
  }
  ctx.assert(isValidNumber(parseNumber(username)), 400, 'Invalid phonenumber.')
  try {
    const user = await users.store(userProps)
    ctx.logger.debug(`Creating user ${user}`)
    ctx.body = {
      ...user
    }
  } catch (error) {
    ctx.throw(400, error)
  }
}

export async function update (ctx: AccountsAppContext): Promise<void> {
  // const { body } = ctx.request
  // ctx.logger.debug(`Updating user ${ctx.request}`)
  const { users } = ctx
  const { username, password } = ctx.request.body
  ctx.logger.debug(`Updating user ${username}`)
  ctx.assert(username != null, 400, '"username" is required')
  ctx.assert(password != null, 400, '"password" is required')
  const salt = await bcrypt.genSalt()
  const hashedPassword = bcrypt.hashSync(password, salt)

  const userProps: UserProps = {
    username: username,
    password: hashedPassword
  }
  ctx.assert(isValidNumber(parseNumber(username)), 400, 'Invalid phonenumber.')
  try {
    const user = await users.update(userProps)
    ctx.logger.debug(`Creating user ${user}`)
    ctx.body = {
      ...user
    }
  } catch (error) {
    ctx.throw(400, error)
  }

  ctx.response.status = 200
}

export function createValidation (): Config {
  return {
    validate: {
      type: 'json',
      body: Joi.object().keys({
        username: Joi.string().required(),
        password: Joi.string().required()
      })
    }
  }
}
