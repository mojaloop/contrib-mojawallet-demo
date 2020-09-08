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
import { AccountsAppContext } from "../../index"
import { MobileMoneyTransactionRequest, MobileMoneyTransaction } from "../../types/mobile-money"
import { TransactionRequestsPostRequest } from "../../types/mojaloop"
import DefaultConfig from '../../../config/default.json'

const config = rc('MW', DefaultConfig)
const PAYER_FSPID = config.DFSP_ID || 'mojawallet'

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
