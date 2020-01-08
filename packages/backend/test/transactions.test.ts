import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Transactions API Test', () => {
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

  describe('Create a transaction', () => {
    let account: any
    beforeEach(async () => {
      account = await appContainer.accountsService.add({
        assetCode: 'XRP',
        assetScale: 6,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
    })

    it('User cant add a transaction for an account', async () => {
      const response = axios.post(`http://localhost:${appContainer.port}/transactions`, {
        accountId: account.id,
        amount: '100'
      }
      , {
        headers: {
          authorization: 'Bearer user1token'
        }
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 404'))
    })
  })

  describe('Getting a transaction for account', () => {
    let account: any
    beforeEach(async () => {
      account = await appContainer.accountsService.add({
        assetCode: 'XRP',
        assetScale: 6,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
      await appContainer.transactionsService.create(account.id, 100n)
    })

    it('User can get own accounts transactions', async () => {
      const response = await axios.get(`http://localhost:${appContainer.port}/transactions?accountId=${account.id}`
        , {
          headers: {
            authorization: 'Bearer user1token'
          }
        }).then(resp => {
        expect(resp.status).toBe(200)
        return resp.data
      })

      expect(response.length).toBe(1)
      expect(response[0].amount).toBe('100')
      expect(response[0].accountId).toBe(account.id.toString())
    })

    it('User cant get someone elses accounts transactions', async () => {
      const response = axios.get(`http://localhost:${appContainer.port}/transactions?accountId=${account.id}`
        , {
          headers: {
            authorization: 'Bearer user2token'
          }
        })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })
})
