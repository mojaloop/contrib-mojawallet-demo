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
import { QuoteResponse, QuoteResponseTool } from '../services/quoteResponse-service'

export async function quoteResponse (ctx: AccountsAppContext): Promise<void> {
  const { quotes, quotesResponse } = ctx
  const { id } = ctx.params
  const { body } = ctx.request
  // TODO: Fire off an error if can't find quote.
  const retrievedQuote = await quotes.get(id)
  ctx.logger.info('quoteResponse retrievedQuote', retrievedQuote)
  ctx.status = 200

  // Call the deferred job if we need
  const quote = ctx.request.body as QuoteResponse
  const matchInput = `quotes/${id}`
  ctx.deferredJob.fire(matchInput, quote)

  if (retrievedQuote) {
    try {
      const transactionRequest = await ctx.transactionRequests.getByTransactionId(retrievedQuote.transactionId)
      ctx.logger.info('quoteResponse transactionRequest', transactionRequest)
      const quoteResponseTools = new QuoteResponseTool(body, id)
      await quotesResponse.store(quoteResponseTools.getQuoteResponseProps())
      if (transactionRequest) {
        const query = `authenticationType=OTP&retriesLeft=1&amount=${body.transferAmount.amount}&currency=${body.transferAmount.currency}`
        ctx.logger.info('requesting auth', query)
        const auth = await ctx.mojaloopRequests.getAuthorizations(transactionRequest.transactionRequestId, query, ctx.request.headers['fspiop-source'])
        ctx.logger.info('quoteResponse auth', auth)
      }
      return
    } catch (error) {
      ctx.logger.error(error)
    }
  }
}
