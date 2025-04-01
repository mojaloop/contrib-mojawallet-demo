/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Cairin Michie <cairin@coil.com>
- Donovan Changfoot <don@coil.com>
- Matthew de Haast <matt@coil.com>
- Talon Patterson <talon.patterson@coil.com>
*****/

import bcrypt from 'bcrypt'
import { Joi } from 'koa-joi-router'
import { AccountsAppContext } from '..'
import { ValidationError } from 'joi'

export const postLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  login_challenge: Joi.string().required().meta({ message: 'login_challenge is required' })
})

export const getLoginSchema = Joi.object({
  login_challenge: Joi.string().required().meta({ message: 'login_challenge is required' })
})

export async function show (ctx: AccountsAppContext): Promise<void> {
  const { hydraApi } = ctx
  const challenge = ctx.request.query.login_challenge
  ctx.logger.debug('Get login request', { challenge })

  try {
    await getLoginSchema.validate({ login_challenge: challenge })
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
    ctx.status = 422
    return
  }

  const loginRequest = await hydraApi.getLoginRequest(challenge).catch((error: any) => {
    ctx.logger.error(error, 'error in login request')
    throw error
  })

  if (loginRequest['request_url']) {
    const requestUrl = new URL(loginRequest['request_url'])
    const signupSessionId = requestUrl.searchParams.get('signupSessionId')

    const session = signupSessionId ? await ctx.knex('signupSessions').where('id', signupSessionId).first() : null
    // Auto login users if they just signed up
    if (session) {
      const now = Date.now()
      if (session.expiresAt > now) {
        const acceptLogin = await hydraApi.acceptLoginRequest(challenge, { subject: session.userId,
          remember: true,
          remember_for: 604800 // 1 week
        }).catch((error: any) => {
          ctx.logger.error(error, 'error in accept login request')
          throw error
        })
        ctx.status = 200
        ctx.body = { redirectTo: acceptLogin['redirect_to'] }
        return
      }
    }
  }

  if (loginRequest['skip']) {
    const acceptLogin = await hydraApi.acceptLoginRequest(challenge, { subject: loginRequest['subject'],
      remember: true,
      remember_for: 604800 // 1 week
    }).catch((error: any) => {
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
  const { users, hydraApi } = ctx
  const { username, password } = ctx.request.body
  const challenge = ctx.request.query.login_challenge

  ctx.logger.debug('Post login request', { username: username, challenge })

  try {
    await postLoginSchema.validate({ username, password, login_challenge: challenge })
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
    ctx.status = 422
    return
  }

  const user = await users.getByUsername(username).catch(() => {
    ctx.body = {
      message: 'Validation Failed',
      errors: [
        {
          field: 'username',
          message: 'User does not exist'
        }
      ]
    }
    ctx.status = 422
  })

  if (!user) {
    return
  }

  if (!await bcrypt.compare(password, user!.password)) {
    ctx.body = {
      message: 'Validation Failed',
      errors: [
        {
          field: 'password',
          message: 'Invalid password'
        }
      ]
    }
    ctx.status = 422
    return
  }

  const acceptLogin = await hydraApi.acceptLoginRequest(challenge, {
    subject: user!.id.toString(),
    remember: true,
    remember_for: 604800 // 1 week
  }).catch((error: any) => {
    ctx.logger.error(error, 'error in accept login request')
    throw error
  })

  ctx.body = {
    redirectTo: acceptLogin['redirect_to']
  }
}
