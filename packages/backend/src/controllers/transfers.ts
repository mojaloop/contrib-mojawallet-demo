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

import { AccountsAppContext } from '../../src/index'
import { TransfersPostRequest, TransfersIDPutResponse } from '../types/mojaloop'

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
