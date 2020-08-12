import { AccountsAppContext } from "../../src/index"
import { TransfersPostRequest, TransfersIDPutResponse } from "../types/mojaloop"
import { StoredTransfer } from "../services/mojaloop-service"
import { quoteResponse } from "./quoteResponse"
const IlpPacket = require('ilp-packet')

const toBigInt = (value: string, scale: number): bigint => {
  const floatValue = parseFloat(value)
  const intValue = (floatValue * 10 ** (scale)).toFixed(0)
  return BigInt(intValue)
}

export async function create (ctx: AccountsAppContext) {
  const { transactions, pusher } = ctx
  const transferRequest = ctx.request.body as TransfersPostRequest
  const binaryPacket = Buffer.from(transferRequest.ilpPacket, 'base64')
  const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket)
  const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString(), 'base64').toString('utf8'))

  const mobileMoneyTransaction = await ctx.mobileMoneyTransactions.getByMojaTransactionId(dataElement.transactionId)
  const creditorAccountId = mobileMoneyTransaction.creditParty.find(data => data.key === 'accountId')
  if (!creditorAccountId) {
    throw new Error('Could not process transfer: No creditor account information.')
  }
  
  const bigInt = toBigInt(transferRequest.amount.amount, 2)
  await transactions.create(creditorAccountId.value, bigInt)
  await pusher.trigger({
    channel: `account-${creditorAccountId.value}`,
    name: 'transaction',
    data: {
      message: bigInt.toString()
    }
  })

  await ctx.mobileMoneyTransactions.updateStatus(mobileMoneyTransaction.transactionReference, 'completed')

  const transferResponse: TransfersIDPutResponse = {
    transferState: 'COMMITTED',
    fulfilment: ctx.ilpService.calculateFulfil(transferRequest.ilpPacket),
    completedTimestamp: (new Date(Date.now())).toISOString()
  }

  await ctx.mojaloopRequests.putTransfers(transferRequest.transferId, transferResponse, ctx.request.headers['fspiop-source'])
  ctx.response.status = 201
}