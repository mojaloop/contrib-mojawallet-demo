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

import rc from 'rc'
import { AccountsAppContext } from '../index'
import { Account } from '../services/accounts-service'
import DefaultConfig from '../../config/default.json'

const config = rc('MW', DefaultConfig)
const allowedServices = config.ALLOWED_SERVICES || ['ilp-service', 'users-service']

// TODO: Only our services should be able to call this I think
const enforceCreate = (subject: string): boolean => {
  return allowedServices.includes(subject)
}

const enforceGet = (subject: string, account: Account): boolean => {
  return allowedServices.includes(subject) || account.userId === subject
}

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { accounts, transactions } = ctx
  const { body } = ctx.request

  const account = await accounts.get(body.accountId)

  if (!enforceCreate(ctx.state.user.sub)) {
    return
  }

  try {
    await transactions.create(account.id, BigInt(body.amount))
    ctx.status = 201
  } catch (error) {
    console.log(error)
  }
}

export async function index (ctx: AccountsAppContext): Promise<void> {
  const { accounts, transactions } = ctx
  const { accountId, aggregateTime } = ctx.query

  const account = await accounts.get(accountId)

  if (!enforceGet(ctx.state.user.sub, account)) {
    ctx.status = 403
    return
  }

  ctx.body = await transactions.get(accountId, aggregateTime)
}
