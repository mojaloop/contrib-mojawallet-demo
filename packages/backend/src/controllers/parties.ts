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

import rc from 'rc'
import { AccountsAppContext } from '../index'
import DefaultConfig from '../../config/default.json'

const config = rc('MW', DefaultConfig)
const fspId = config.DFSP_ID || 'mojawallet'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const { users, mojaloopRequests } = ctx
  const { msisdnNumber } = ctx.params
  const destFspId = ctx.get('fspiop-source')
  const user = await users.getByUsername('+' + msisdnNumber)
  if (user) {
    await mojaloopRequests.putParties('MSISDN', msisdnNumber, null, {
      party: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: msisdnNumber,
          fspId: fspId
        }
      }
    }, destFspId)
  }
  ctx.status = 202
}

export async function successCallback (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  logger.info('sending to parties successful', ctx.request.body)
  ctx.status = 200
}

export async function errorCallback (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  logger.info('Sending to parties failed', ctx.request.body)
  ctx.status = 200
}
