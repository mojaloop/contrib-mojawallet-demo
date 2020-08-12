import bcrypt from 'bcrypt'
import { Joi } from 'koa-joi-router'
import { AccountsAppContext } from '..'
import { UserProps, User } from '../services/user-service'
import { parseNumber, isValidNumber, ParsedNumber } from 'libphonenumber-js'
import { v4 } from 'uuid'
import { ValidationError } from 'joi'

const DFSP_ID = process.env.DFSP_ID || 'mojawallet'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const { users } = ctx
  ctx.logger.debug('Get me request')
  ctx.assert(ctx.state.user && ctx.state.user.sub, 401)
  let user: User
  try {
    user = await users.getById(ctx.state.user.sub)
    ctx.assert(user, 404, 'User not found.')
    ctx.body = {
      id: user.id,
      username: user.username
    }
  } catch (error) {
    ctx.throw(400, error)
  }
}

export const createUserSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
})

export async function store (ctx: AccountsAppContext): Promise<void> {
  const { users, mojaloopRequests, logger } = ctx
  const { username, password } = ctx.request.body

  ctx.logger.debug(`Creating user ${username}`)

  try {
    await createUserSchema.validate({ username, password })
  } catch (error) {
    const e: ValidationError = error
    ctx.body = {
      message: 'Validation Failed',
      errors: e.details.map(detail => {
        return {
          field: detail.context!.label,
          message: detail.message
        }
      })
    }
    logger.info('Unable to store user', ctx)
    ctx.status = 422
    return
  }

  if (!isValidNumber(parseNumber(username) as any as ParsedNumber)) {
    ctx.body = {
      message: 'Validation Failed',
      errors: [
        {
          field: 'username',
          message: 'Invalid phone number entered'
        }
      ]
    }
    logger.info('Invalid username', ctx)
    ctx.status = 422
    return
  }

  try {
    if (await users.getByUsername(username)) {
      ctx.body = {
        message: 'Validation Failed',
        errors: [
          {
            field: 'username',
            message: 'Username already exists'
          }
        ]
      }
      ctx.status = 422
      return
    }
  } catch (error) {
    // Don't do anything as if we get here we can actually create the user
  }

  const salt = await bcrypt.genSalt()
  const hashedPassword = bcrypt.hashSync(password, salt)

  const userProps: UserProps = {
    username: username,
    password: hashedPassword
  }

  try {
    const user = await users.store(userProps)

    logger.debug(`Creating user ${user}`)

    const signupSessionId = v4()
    await ctx.knex('signupSessions').insert({
      id: signupSessionId,
      userId: user.id,
      expiresAt: (new Date(Date.now() + 1000 * 30)).getTime()
    })

    await mojaloopRequests.postParticipants({
      requestId: v4(),
      partyList: [{
        partyIdentifier: username.replace('+', ''),
        partyIdType: 'MSISDN',
        fspId: DFSP_ID
      }]
    }).then(() => {
      logger.info('User submitted to Mojawallet and to ALS')
    }).catch(error => {
      logger.error('Error adding participant to ALS', error.response)
    })

    ctx.body = {
      id: user.id,
      username: user.username,
      signupSessionId
    }
  } catch (error) {
    console.log(error)
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
  ctx.assert(isValidNumber(parseNumber(username) as any as ParsedNumber), 400, 'Invalid phonenumber.')
  try {
    const user = await users.update(userProps)
    ctx.logger.debug(`Creating user ${user}`)
    ctx.body = {
      id: user.id,
      username: user.username
    }
  } catch (error) {
    ctx.throw(400, error)
  }

  ctx.response.status = 200
}
