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

export async function store (ctx: AccountsAppContext): Promise<void> {
  ctx.logger.info('Register Oauth2 client request', { body: ctx.request.body })
  const clientDetails = ctx.request.body

  try {
    const client = await hydraApi.createOauthClient(clientDetails)
    ctx.body = client
  } catch (error) {
    ctx.logger.error('Could not register client on oauth provider.', { error: error.response })
    ctx.status = 500
    ctx.message = 'Could not register client on oauth provider.'
  }
}

export function createValidation (): Config {
  return {
    validate: {
      type: 'json',
      body: Joi.object({
        client_id: Joi.string().required(),
        client_name: Joi.string().optional(),
        scope: Joi.string().optional(),
        logo_uri: Joi.string().optional(),
        response_types: Joi.array().items(Joi.string()).optional(),
        grant_types: Joi.array().items(Joi.string()).optional(),
        redirect_uris: Joi.array().items(Joi.string()).optional(),
        token_endpoint_auth_method: Joi.string().optional()
      })
    }
  }
}
