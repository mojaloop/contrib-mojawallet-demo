import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Accounts API Test', () => {
  let appContainer: TestAppContainer

  beforeAll(() => {
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

  describe('Creating Account', () => {
    test('Can create an account if valid user', async () => {
      const response = await axios.post(`http://localhost:${appContainer.port}/accounts`, {
        name: 'test'
      }, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      expect(response.userId).toBe('1')
      expect(response.name).toBe('test')
    })

    test('Cant create an account if invalid user', async () => {
      const response = axios.post(`http://localhost:${appContainer.port}/accounts`, {
        name: 'test'
      }, {
        headers: {
          authorization: 'Bearer user3token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 401'))
    })
  })

  describe('Updating Account', () => {
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

    it('User can update their own account', async () => {
      await axios.patch(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        name: 'new test'
      }, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      const edittedAccount = await appContainer.accountsService.get(account.id)

      expect(edittedAccount.name).toBe('new test')
    })

    it('User cant update another users account', async () => {
      const response = axios.patch(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        name: 'new test'
      }, {
        headers: {
          authorization: 'Bearer user2token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })

  describe('Getting an Account', () => {
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

    it('User can get their own account', async () => {
      const response = await axios.get(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      expect(response.name).toBe('Test')
    })

    it('User cant get someone elses account', async () => {
      const response = axios.get(`http://localhost:${appContainer.port}/accounts/${account.id}`, {
        headers: {
          authorization: 'Bearer user2token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })

  describe('Getting all user accounts', () => {
    beforeEach(async () => {
      await appContainer.accountsService.add({
        assetCode: 'XRP',
        assetScale: 6,
        limit: 0n,
        name: 'Test',
        userId: '1'
      })
      await appContainer.accountsService.add({
        assetCode: 'XRP',
        assetScale: 6,
        limit: 0n,
        name: 'Test 2',
        userId: '1'
      })
    })

    it('User can get their own accounts', async () => {
      const response = await axios.get(`http://localhost:${appContainer.port}/accounts?userId=1`, {
        headers: {
          authorization: 'Bearer user1token'
        }
      }).then(resp => {
        return resp.data
      })

      expect(response.length).toBe(2)
      response.forEach((account: any) => {
        expect(account.userId).toBe('1')
      })
    })

    it('User cant get someone elses account', async () => {
      const response = axios.get(`http://localhost:${appContainer.port}/accounts?userId=1`, {
        headers: {
          authorization: 'Bearer user2token'
        }
      }).then(resp => {
        return resp.data
      })

      await expect(response).rejects.toEqual(Error('Request failed with status code 403'))
    })
  })
})
