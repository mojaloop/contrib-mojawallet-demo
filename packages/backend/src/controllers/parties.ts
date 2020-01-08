import { AccountsAppContext } from '../index'

const fspId = process.env.FSP_ID || 'mojawallet'

export async function show (ctx: AccountsAppContext): Promise<void> {
  const { users, mojaloopRequests } = ctx
  const { msisdnNumber } = ctx.params
  const destFspId = ctx.get('fspiop-source')
  const user = await users.getByUsername('+' + msisdnNumber)
  if (user) {
    await mojaloopRequests.putParties('MSISDN', msisdnNumber, {
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
