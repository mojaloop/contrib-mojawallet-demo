import { v4 } from 'uuid'
import { AccountsAppContext } from '../index'

const DFSP_ID = process.env.DFSP_ID || 'mojawallet'

export async function index (ctx: AccountsAppContext): Promise<void> {
  const { mojaloopRequests, logger, users } = ctx

  logger.debug('Request to refresh the ALS Parties')

  const partyList = await users.getAll().then(users => {
    return users.map(user => {
      return {
        partyIdentifier: user.username.replace('+', ''),
        partyIdType: 'MSISDN',
        fspId: DFSP_ID
      }
    })
  })

  await mojaloopRequests.postParticipants({
    requestId: v4(),
    partyList
  }).then(() => {
    logger.info('User submitted to Mojawallet and to ALS')
  }).catch((error: any) => {
    logger.error('Error adding participant to ALS', error.response)
  })

  ctx.status = 200
}
