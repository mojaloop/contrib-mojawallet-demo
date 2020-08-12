
import { AccountsAppContext } from "../index"
import { QuotesIDPutResponse, QuotesPostRequest } from "../types/mojaloop"
const MlNumber = require('@mojaloop/ml-number')

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