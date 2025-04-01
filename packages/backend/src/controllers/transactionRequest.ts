/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Cairin Michie <cairin@coil.com>
- Donovan Changfoot <don@coil.com>
- Matthew de Haast <matt@coil.com>
- Talon Patterson <talon.patterson@coil.com>
*****/

import { AccountsAppContext } from '../index'
import { QuoteTools } from '../services/quote-service'
import { mojaResponseService } from '../services/mojaResponseService'
import { TransactionRequestsPostRequest, TransactionRequestsIDPutResponse } from '../types/mojaloop'

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { transactionRequests, quotes, users, mojaloopRequests } = ctx
  const { body } = ctx.request
  const destFspId = ctx.get('fspiop-source')
  const payerUserName = (body as TransactionRequestsPostRequest).payer.partyIdentifier

  ctx.status = 202
  let transaction
  try {
    const user = await users.getByUsername('+' + payerUserName).catch(() => {
      throw new Error('3204')
    })

    // TODO look how to reenable this validation
    // const activeOtp = await otp.getActiveOtp(user.id.toString())
    // if (activeOtp) {
    //   const account = await accounts.get(activeOtp.accountId)
    //   // currency is not taken into account when checking available funds
    //   if (account.balance < (parseInt(body.amount.amount) * 100)) {
    //     ctx.logger.error('Account does not have sufficent funds to initiate transaction')
    //     throw new Error('4000')
    //   }
    // } else {
    //   ctx.logger.error('Could not find a valid OTP for the given account')
    //   throw new Error('4000')
    // }

    try {
      transaction = await transactionRequests.create(body, user.id)
    } catch (error) {
      ctx.logger.error('Error creating transaction Request', { error: error })
      throw new Error('3100')
    }
    // potentially change to a queing system for asynchronous responses to avoid unhandled promises
    await ctx.mojaloopRequests.putTransactionRequests(
      body.transactionRequestId,
      {
        transactionRequestState: 'RECEIVED',
        transactionId: transaction.transactionId
      },
      destFspId
    )
  } catch (error) {
    let errorCode
    let errorDescription
    if (error.message === '3204') {
      errorCode = '3204'
      errorDescription = 'Party not found'
    } else if (error.message === '4000') {
      errorCode = '4000'
      errorDescription = 'Payer error, unable to complete transaction request'
    } else {
      errorCode = '3100'
      errorDescription = 'Invalid transaction request'
    }
    ctx.logger.error(error, 'Error in transactionRequests')
    await mojaResponseService.putErrorResponse(
      {
        errorInformation: {
          errorCode,
          errorDescription,
          extensionList: []
        }
      },
      body.transactionRequestId,
      destFspId
    ).catch(error => {
      ctx.logger.error('Error sending error response back', { error: error.response })
    })
  }
  if (transaction) {
    try {
      ctx.logger.info('Quote flow started.')
      await sleep(100)
      const quoteTools = new QuoteTools(body, transaction.transactionId)
      const quoteResponse = await quotes.add(quoteTools.getQuote())
      ctx.logger.info('quoteResponse received body', quoteResponse)
      const postQuotes = await mojaloopRequests.postQuotes(quoteTools.getQuote(), destFspId)
      ctx.logger.info('postQuotes received body', postQuotes)
    } catch (error) {
      ctx.logger.error(error, 'Error in transactionRequests')
    }
  }
}

export async function update (ctx: AccountsAppContext): Promise<void> {
  const payload = ctx.request.body as TransactionRequestsIDPutResponse
  ctx.logger.info('Received Mojaloop transaction request update: ', payload)

  if (payload.transactionId) {
    await ctx.mobileMoneyTransactions.updateMojaTransactionId(ctx.params.transactionRequestId, payload.transactionId)
  }

  ctx.response.status = 200
}
