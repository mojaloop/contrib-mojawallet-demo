import { AccountsAppContext } from '../index'

const fspId = process.env.FSP_ID || 'mojawallet'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const { users, mojaloopRequests } = ctx
  const { msisdnNumber } = ctx.params
  const destFspId = ctx.get('fspiop-source')
  const user = await users.getByUsername('+' + msisdnNumber)
  if (user) {
    await mojaloopRequests.putParties('MSISDN', msisdnNumber, null, {
      party: {
        partyIdInfo: {
          partyIdType: 'MSISDN',
          partyIdentifier: msisdnNumber,
          fspId: fspId
        }
      }
    }, destFspId)
  }
  ctx.status = 200
}

export async function successCallback (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  logger.info('sending to parties successful', ctx.body)
  ctx.status = 200
}

export async function errorCallback (ctx: AccountsAppContext): Promise<void> {
  const { logger } = ctx
  logger.info('Sending to parties failed', ctx.body)
  ctx.status = 200
}
