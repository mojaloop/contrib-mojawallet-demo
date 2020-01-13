import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Faucet API Test', () => {
  let appContainer: TestAppContainer

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Add from faucet', () => {
    let account: any
    beforeEach(async () => {
      account = await appContainer.accountsService.add({
        assetCode: 'XML',
        assetScale: 2,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
    })

    test('User can add money via fuacet', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/faucet`, {
        accountId: account.id
      }
      , {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        expect(resp.status).toBe(201)
        return resp.data
      })

      const acc = await appContainer.accountsService.get(account.id)
      expect(acc.balance.toString()).toBe('10000')
    })

    test('User cant add a transaction for an account that\'s not theirs', async () => {
      const response = axios.post(`http://localhost:${appContainer.port}/transactions`, {
        accountId: account.id,
        amount: '100'
      }
      , {
        headers: {
          authorization: 'Bearer user2token'
        }
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 404'))
    })
  })
})
