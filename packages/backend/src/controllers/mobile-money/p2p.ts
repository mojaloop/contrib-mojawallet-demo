import { AccountsAppContext } from "src";
import { sleep } from '../../services/util'
import { MobileMoneyP2PFeesRequest, MobileMoneyP2PInitializeRequest, MobileMoneyP2PMakeTransferRequest } from "src/types/mobile-money";
import { PartyResult, TransfersIDPutResponse, TransfersPostRequest } from "src/types/mojaloop";
import { QuoteTools } from "../../services/quote-service";
import { QuoteResponse } from "src/services/quoteResponse-service";
import DefaultConfig from '../../../config/default.json'
import rc from 'rc'
import uuidv4 = require('uuid/v4')
import { StoredTransfer } from "src/services/mojaloop-service";


const config = rc('MW', DefaultConfig)
const PAYER_FSPID = config.DFSP_ID || 'mojawallet'


/**
 * @description Initialize a new P2P Payment
 *    with a PartyIdType + PartyIdentifier and wait for a deffered Job
 *    callback
 * @param ctx 
 */
export async function create (ctx: AccountsAppContext) {
  const initializeRequest = ctx.request.body as MobileMoneyP2PInitializeRequest
  if (!initializeRequest) {
    ctx.response.status = 400
    return
  }

  const match = `parties/${initializeRequest.creditPartyType}/${initializeRequest.creditPartyId}`
  const onTriggered = await ctx.deferredJob.listenOnce(match)
  await ctx.mojaloopRequests.getParties(
        initializeRequest.creditPartyType, initializeRequest.creditPartyId, null)

  return onTriggered(4000)
    .then((response: PartyResult) => {
      ctx.response.body = response
      ctx.response.status = 200
    })
    .catch(err => {
      ctx.response.status = 400
    })
}

export async function getFees (ctx: AccountsAppContext) {
  const {quotes, mojaloopRequests } = ctx

  const getFeesRequest = ctx.request.body as MobileMoneyP2PFeesRequest
  const quoteTools = new QuoteTools(getFeesRequest.transactionReq, getFeesRequest.transactionId)

  const quoteResponse = await quotes.add(quoteTools.getQuote())
  ctx.logger.info('quoteResponse received body', quoteResponse)
  
  // make the sure we know who to address
  if (!getFeesRequest.transactionReq.payee.partyIdInfo.fspId) {
    ctx.logger.error('no fspId for payee.partyIdInfo.fspId')
    ctx.code = 400
    return
  }
  
  const match = `quotes/${quoteResponse.quoteId}`
  const onTriggered = await ctx.deferredJob.listenOnce(match)
  const destFspId = getFeesRequest.transactionReq.payee.partyIdInfo.fspId!
  await mojaloopRequests.postQuotes(quoteTools.getQuote(), destFspId)

  return onTriggered(4000)
    .then((response: QuoteResponse) => {
      ctx.response.body = {
        quoteId: quoteResponse.quoteId,
        quoteResponse: response
      }
      ctx.response.status = 200
    })
    .catch(err => {
      ctx.response.status = 400
    })
}

export async function makeTransfer (ctx: AccountsAppContext) {
  
  const transferId = uuidv4()
  const makeTransferRequest = ctx.request.body as MobileMoneyP2PMakeTransferRequest
  const quoteResponse = makeTransferRequest.quoteResponse
  const transferBody: TransfersPostRequest = {
    amount: quoteResponse.transferAmount,
    condition: quoteResponse.condition,
    expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ilpPacket: quoteResponse.ilpPacket,
    payeeFsp: makeTransferRequest.payeeFsp,
    payerFsp: PAYER_FSPID,
    transferId
  }
  const transfer: StoredTransfer = {
    transferId,
    transactionId: makeTransferRequest.transactionId,
    transactionRequestId: makeTransferRequest.transactionRequestId,
    quoteId: makeTransferRequest.quoteId,
    // accountId: storedOtp.accountId,
    // TODO: where to get this from?
    accountId: "1",
    isReverted: false
  }

  const match = `transfers/${transferId}`
  const onTriggered = await ctx.deferredJob.listenOnce(match)

  await ctx.mojaloopService.initiateTransfer(transferBody, transfer)
  return onTriggered(4000)
    .then((response: TransfersIDPutResponse) => {
      ctx.response.body = response
      ctx.response.status = 200
    })
    .catch(err => {
      ctx.response.status = 400
    })
}