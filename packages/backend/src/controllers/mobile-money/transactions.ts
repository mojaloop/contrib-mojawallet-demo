import { AccountsAppContext } from "../../index"
import { MobileMoneyTransactionRequest, MobileMoneyTransaction } from "../../types/mobile-money"
import uuid, { v4 } from 'uuid'
import { TransactionRequestsPostRequest } from "../../types/mojaloop"

const PAYER_FSPID = process.env.PAYER_FSPID || 'mojawallet'

export async function create (ctx: AccountsAppContext) {

  const transactionRequest = ctx.request.body as MobileMoneyTransactionRequest
  if (!transactionRequest || transactionRequest.type !== 'merchantpay') {
    ctx.logger.error('Mobile Money transaction is not of type merchant pay', transactionRequest)
    ctx.response.status = 501
    return
  }

  try {
    // TODO: assuming that the payer is with mojawallet
    const transaction = await ctx.mobileMoneyTransactions.create(transactionRequest)
    const mojaTransactionRequest = mapToMojaTransactionRequest(transaction)

    await ctx.mojaloopRequests.postTransactionRequests(mojaTransactionRequest, PAYER_FSPID)
    ctx.response.body = transaction
  } catch (error) {
    console.log('error', error)
  }
}

export async function show (ctx: AccountsAppContext) {
  const transactionReference = ctx.params['transactionReference']

  try {
    const transaction = await ctx.mobileMoneyTransactions.get(transactionReference)
    ctx.response.body = transaction
    ctx.response.status = 200
  } catch (error) {
    console.log('error', error)
    ctx.response.status = 404
  }
}

function mapToMojaTransactionRequest (mobileMoneyRequest: MobileMoneyTransaction): TransactionRequestsPostRequest {
  return {
    transactionRequestId: mobileMoneyRequest.transactionReference,
    amount: {
      amount: mobileMoneyRequest.amount,
      currency: 'USD'
    },
    payee: {
      partyIdInfo: {
        partyIdType: 'MSISDN',
        partyIdentifier: mobileMoneyRequest.creditParty[0].value,
        fspId: PAYER_FSPID
      }
    },
    payer: {
      partyIdType: 'MSISDN',
      partyIdentifier: mobileMoneyRequest.debitParty[0].value,
      fspId: PAYER_FSPID
    },
    transactionType: {
      scenario: "PAYMENT",
      initiator: "PAYEE",
      initiatorType: "BUSINESS"
    }
  }
}