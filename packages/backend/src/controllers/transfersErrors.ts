import { AccountsAppContext } from '../index'
import { StoredTransfer } from '../services/mojaloop-service'

export async function transfersErrors (ctx: AccountsAppContext): Promise<void> {
  const { logger, transactions, knex, transactionRequests } = ctx
  const { id } = ctx.params
  const { body } = ctx.request

  ctx.logger.error(`Transfer error with details: ${id}: ${JSON.stringify(body)}`)

  try {
    const retrievedTransfer = await knex<StoredTransfer>('transfers')
      .where({ transferId: id })
      .first()

    if (retrievedTransfer) {
      if (retrievedTransfer.isReverted) {
        throw new Error('Transfer has already been reverted')
      }
      const transactionRequest = await transactionRequests.getByRequestId(retrievedTransfer.transactionRequestId)

      if (transactionRequest) {
        await transactions.create(retrievedTransfer.accountId, BigInt(Math.floor(parseInt(transactionRequest.amount.amount) * 100)), `Revert transaction id: ${transactionRequest.transactionId}`)
        await knex('transfers')
          .where({ transferId: id })
          .update({ isReverted: true })
      } else {
        throw new Error('Referenced transaction request does not exist')
      }
    } else {
      throw new Error('Transfer does not exist')
    }
  } catch (error) {
    logger.info('unable to process transfer error', error)
  }
  ctx.status = 200
}
