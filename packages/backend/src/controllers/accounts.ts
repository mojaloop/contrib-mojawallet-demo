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
import { AccountsAppContext } from '../'
import { Account, AccountProps } from '../services/accounts-service'
import DefaultConfig from '../../config/default.json'

const config = rc('MW', DefaultConfig)
const allowedServices = config.ALLOWED_SERVICES || ['ilp-service', 'users-service']

const enforce = (subject: string, account: Account): boolean => {
  return account.userId === subject || allowedServices.includes(subject)
}

const enforceGetUserAcccounts = (subject: string, userId: string): boolean => {
  return userId === subject || allowedServices.includes(subject)
}

export async function create (ctx: AccountsAppContext): Promise<void> {
  const { accounts, transactions, pusher } = ctx
  const { body } = ctx.request

  ctx.logger.info('Creating an account', { body })

  const accountProps: AccountProps = {
    userId: ctx.state.user.sub,
    name: body.name,
    assetCode: 'XML',
    assetScale: 2,
    limit: 0n
  }

  try {
    const account = await accounts.add(accountProps)

    // TODO Temp automatically add money
    await transactions.create(account.id, BigInt(200000), 'Faucet Money')
    await pusher.trigger({
      channel: `account-${account.id}`,
      name: 'transaction',
      data: {
        message: (BigInt(200000)).toString()
      }
    })

    ctx.body = {
      ...account,
      balance: account.balance.toString(),
      limit: account.limit.toString()
    }
  } catch (error) {
    ctx.logger.error('Error creating account', { error })
    throw error
  }
}

export async function update (ctx: AccountsAppContext): Promise<void> {
  const { accounts } = ctx
  const { id } = ctx.params
  const { body } = ctx.request

  ctx.logger.info('Updating an account', { id, body, ctx })

  const account = await accounts.get(id)

  if (!enforce(ctx.state.user.sub, account)) {
    ctx.status = 403
    return
  }

  const accountProps: AccountProps = {
    userId: account.userId,
    name: body.name,
    assetCode: account.assetCode,
    assetScale: account.assetScale,
    limit: account.limit
  }

  try {
    const account = await accounts.update(id, accountProps)
    ctx.body = {
      ...account,
      balance: account.balance.toString(),
      limit: account.limit.toString()
    }
  } catch (error) {
    ctx.logger.error('Error creating account', { error })
    throw error
  }
}

export async function show (ctx: AccountsAppContext): Promise<void> {
  const { accounts } = ctx
  const { id } = ctx.params

  ctx.logger.info('Getting an account', { id })

  const account = await accounts.get(id)

  if (!account) {
    return
  }

  if (!enforce(ctx.state.user.sub, account)) {
    ctx.status = 403
    return
  }

  ctx.body = {
    ...account,
    balance: account.balance.toString(),
    limit: account.limit.toString()
  }
}

export async function index (ctx: AccountsAppContext): Promise<void> {
  const { accounts } = ctx
  const { userId } = ctx.query

  ctx.logger.info('Getting an account', { userId })

  if (!enforceGetUserAcccounts(ctx.state.user.sub, userId)) {
    ctx.status = 403
    return
  }

  const userAccounts = await accounts.getByUserId(userId)

  ctx.body = userAccounts.map(account => {
    return {
      ...account,
      balance: account.balance.toString(),
      limit: account.limit.toString()
    }
  })
}
