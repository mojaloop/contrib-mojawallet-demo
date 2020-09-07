/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the License) and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

import { AccountsAppContext } from '../index'
import { HydraApi } from '../apis/hydra'

export function createAuthMiddleware (hydraApi: HydraApi) {
  return async (ctx: AccountsAppContext, next: () => Promise<any>): Promise<void> => {
    const { header } = ctx
    let token = ''

    // Get token out of header
    if (header && header.authorization) {
      const parts = header.authorization.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1]
      }
    }
    // Introspect it
    const introspection = await hydraApi.introspectToken(token).catch(error => {
      ctx.logger.debug('Error introspecting token', { error: error.response })
      throw error
    })

    if (!introspection.active) {
      ctx.status = 401
      return
    }

    ctx.state.user = introspection

    await next()
  }
}
