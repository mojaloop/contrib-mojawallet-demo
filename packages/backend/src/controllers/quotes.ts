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
import { QuotesIDPutResponse, QuotesPostRequest } from '../types/mojaloop'

const QUOTE_EXPIRATION_WINDOW = process.env.QUOTE_EXPIRATION_WINDOW || 120

export async function create (ctx: AccountsAppContext) {
  // charge 1 USD in fees
  ctx.logger.info('Received quote request', ctx.request.body)
  const quoteRequest = ctx.request.body as QuotesPostRequest
  const transferAmount = quoteRequest.amount
  const { ilpPacket, condition } = await ctx.ilpService.getQuoteResponseIlp(quoteRequest, { transferAmount })
  const expiration = new Date(Date.now() + Number(QUOTE_EXPIRATION_WINDOW) * 1000).toISOString()

  const response: QuotesIDPutResponse = {
    condition,
    ilpPacket,
    transferAmount,
    expiration
  }
  ctx.logger.info('Sending quote response')
  await ctx.mojaloopRequests.putQuotes(quoteRequest.quoteId, response, ctx.request.headers['fspiop-source'])

  ctx.response.status = 201
}
