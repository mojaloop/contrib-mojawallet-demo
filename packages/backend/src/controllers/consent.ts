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

import { Config, Joi } from 'koa-joi-router'
import { AccountsAppContext } from '..'
import { hydraApi } from '../apis/hydra'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const challenge = ctx.request.query['consent_challenge']
  ctx.logger.debug('Getting consent request', { challenge })

  const consentRequest = await hydraApi.getConsentRequest(challenge).catch(error => {
    ctx.logger.error(error, 'error in login request')
    throw error
  })
  ctx.logger.debug('Got hydra consent request', { consentRequest })

  if (consentRequest['skip'] || consentRequest['client'].client_id === 'frontend-service') {
    const acceptConsent = await hydraApi.acceptConsentRequest(challenge, {
      remember: true,
      remember_for: 0,
      grant_scope: consentRequest['requested_scope'],
      grant_access_token_audience: consentRequest['requested_access_token_audience'],
      session: {
        // // This data will be available when introspecting the token. Try to avoid sensitive information here,
        // // unless you limit who can introspect tokens.
        // access_token: accessTokenInfo,
        //
        // // This data will be available in the ID token.
        // id_token: idTokenInfo
      }
    }).catch(error => {
      ctx.logger.error('Error with hydra accepting consent', { error })
      throw error
    })

    ctx.body = {
      redirectTo: acceptConsent['redirect_to']
    }
    return
  }

  ctx.body = {
    requestedScopes: consentRequest['requested_scope'],
    client: consentRequest['client'], // TODO we should probably not leak all this data to the frontend
    user: consentRequest['subject']
  }
}

export async function store (ctx: AccountsAppContext): Promise<void> {
  const challenge = ctx.request.query['consent_challenge']
  const { accepts, scopes } = ctx.request.body
  ctx.logger.debug('Post consent request', { body: ctx.request.body, challenge })

  if (!accepts) {
    const rejectConsent = await hydraApi.rejectConsentRequest(challenge, {
      error: 'access_denied',
      error_description: 'The resource owner denied the request'
    }).catch(error => {
      ctx.logger.error('error rejecting hydra consent')
      throw error
    })

    ctx.body = {
      redirectTo: rejectConsent['redirect_to']
    }
    return
  }

  const consentRequest = await hydraApi.getConsentRequest(challenge)
  ctx.logger.debug('consent request from hydra', { consentRequest })

  const acceptConsent = await hydraApi.acceptConsentRequest(challenge, {
    remember: true,
    remember_for: 0,
    grant_scope: scopes,
    grant_access_token_audience: consentRequest['requested_access_token_audience'],
    session: {
      // This data will be available when introspecting the token. Try to avoid sensitive information here,
      // unless you limit who can introspect tokens.
      access_token: {

      },
      // This data will be available in the ID token.
      id_token: {

      }
    }
  }).catch(error => {
    ctx.logger.error('Error with hydra accepting consent', { error })
    throw error
  })

  ctx.body = {
    redirectTo: acceptConsent['redirect_to']
  }
}

export function getValidation (): Config {
  return {
    validate: {
      query: {
        consent_challenge: Joi.string().required().error(new Error('consent_challenge is required.'))
      }
    }
  }
}

export function storeValidation (): Config {
  return {
    validate: {
      type: 'json',
      body: {
        accepts: Joi.bool().required(),
        scopes: Joi.array().items(Joi.string()).required(),
        accountId: Joi.number().integer().greater(0).optional()
      },
      query: {
        consent_challenge: Joi.string().required().error(new Error('consent_challenge is required.'))
      }
    }
  }
}
