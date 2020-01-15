import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Tests for the otp endpoints', () => {
  let appContainer: TestAppContainer
  let account: any

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
    account = await appContainer.accountsService.add({
      assetCode: 'XML',
      assetScale: 2,
      limit: 0n,
      name: 'Test',
      userId: '1'
    })
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Tests for generating and storing an otp', () => {
    test('Should generate a 4 digit otp and store it', async () => {
      const response = await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )
      const retrievedOtp = await appContainer.knex('mojaOtp').first()

      if (retrievedOtp) {
        expect(response.status).toEqual(200)
        expect(retrievedOtp.isUsed).toBeFalsy()
        expect(retrievedOtp.expiresAt).toBeGreaterThan(Math.floor((new Date(Date.now()).getTime()) / 1000))
        expect(retrievedOtp.otp).toMatch(new RegExp(/^[0-9]{4}$/))
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Should fail creating a second otp when an active one is present', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(409)
      })
    })

    test('Should fail if an invalid accountId is used', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: 11111 },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(400)
      })
    })

    test('Should fail if an invalid user is used', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user3token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(401)
      })
    })
  })

  describe('Tests for retrieving valid otps', () => {
    test('Should return 404 on no valid otp', async () => {
      await axios.get(
        `http://localhost:${appContainer.port}/otp`,
        { headers: { authorization: 'Bearer user2token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(404)
      })
    })

    test('Should return otp object on with valid otp', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )

      const response = await axios.get(
        `http://localhost:${appContainer.port}/otp`,
        { headers: { authorization: 'Bearer user1token' } }
      )

      if (response) {
        expect(response.status).toEqual(200)
        expect(response.data.isUsed).toBeFalsy()
        expect(response.data.expiresAt).toBeGreaterThan(Math.floor((new Date(Date.now()).getTime()) / 1000))
        expect(response.data.otp).toMatch(new RegExp(/^[0-9]{4}$/))
      } else {
        expect(true).toEqual(false)
      }
    })

    test('Invalid user should return 401', async () => {
      await axios.get(
        `http://localhost:${appContainer.port}/otp`,
        { headers: { authorization: 'Bearer user3token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(401)
      })
    })
  })

  describe('Tests for cancelling an otp', () => {
    test('Should set an otp\'s expiration date to now to "cancel" it', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )

      const response = await axios.post(
        `http://localhost:${appContainer.port}/otp/cancel`,
        {},
        { headers: { authorization: 'Bearer user1token' } }
      )
      expect(response.status).toEqual(200)

      const updatedEntry = await appContainer.knex('mojaOtp').where({ accountId: account.id }).first()

      if (updatedEntry) {
        expect(updatedEntry.expiresAt).toBeLessThanOrEqual(Date.now() / 1000)
      } else {
        expect(true).toEqual(false)
      }      
    })

    test('Should prevent cancellation of an otp without a valid token', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp/cancel`,
        {},
        { headers: { authorization: 'Bearer user3token' } }
      )
      .then(response => {
        expect(response).toBeUndefined()
      })
      .catch(error => {
        expect(error.response.status).toEqual(401)
      })
    })

    test('Should return a 404 on no active otp\'s present', async () => {
      await axios.post(
        `http://localhost:${appContainer.port}/otp/cancel`,
        {},
        { headers: { authorization: 'Bearer user1token' } }
      )
      .then(response => {
        expect(response).toBeUndefined()
      })
      .catch(error => {
        expect(error.response.status).toEqual(404)
      })
    })
  })
})
