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
import { Account } from '../services/accounts-service'

const enforce = (subject: string, account: Account): boolean => {
  return account.userId === subject
}

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { accounts, transactions, pusher } = ctx
  const { body } = ctx.request

  const FAUCET_AMOUNT = 200000

  const account = await accounts.get(body.accountId)

  if (!enforce(ctx.state.user.sub, account)) {
    ctx.status = 403
    return
  }

  try {
    await transactions.create(account.id, BigInt(FAUCET_AMOUNT), 'Faucet Money')
    await pusher.trigger({
      channel: `account-${account.id}`,
      name: 'transaction',
      data: {
        message: (BigInt(FAUCET_AMOUNT)).toString()
      }
    })
    ctx.logger.info('SENDING ACCOUNT BALANCE UPDATE')
    ctx.status = 201
  } catch (error) {
    console.log(error)
  }
}
