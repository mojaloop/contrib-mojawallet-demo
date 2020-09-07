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
import { ErrorQuoteResponseTool } from '../services/quoteResponse-service'

export async function store (ctx: AccountsAppContext): Promise<void> {
  const { logger, quotesResponse } = ctx
  const { id } = ctx.params
  const { body } = ctx.request
  console.log('QUOTE ERRORS', id, body)
  const errorQuoteResponseTool = new ErrorQuoteResponseTool(body, id)
  try {
    await quotesResponse.storeError(errorQuoteResponseTool.getQuoteResponseProps())
    logger.info('Received Quote Error Response', { quoteId: id, body })
  } catch (error) {
    logger.error('Unable to store quote response', error)
  }
  ctx.status = 200
}
