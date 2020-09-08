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

import rc from 'rc'
import { v4 } from 'uuid'
import { AccountsAppContext } from '../index'
import DefaultConfig from '../../config/default.json'

const config = rc('MW', DefaultConfig)
const DFSP_ID = config.DFSP_ID || 'mojawallet'

export async function index (ctx: AccountsAppContext): Promise<void> {
  const { mojaloopRequests, logger, users } = ctx

  logger.debug('Request to refresh the ALS Parties')

  const partyList = await users.getAll().then(users => {
    return users.map(user => {
      return {
        partyIdentifier: user.username.replace('+', ''),
        partyIdType: 'MSISDN',
        fspId: DFSP_ID
      }
    })
  })

  await mojaloopRequests.postParticipants({
    requestId: v4(),
    partyList
  }).then(() => {
    logger.info('User submitted to Mojawallet and to ALS')
  }).catch((error: any) => {
    logger.error('Error adding participant to ALS', error.response)
  })

  ctx.status = 200
}
