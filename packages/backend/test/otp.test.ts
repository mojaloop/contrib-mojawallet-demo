import axios from "axios"
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
      assetCode: 'XRP',
      assetScale: 6,
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

    test('Should fail creating a second otp when an active one is present', async ()=> {
      const response1 = await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      )
      const response2 = await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: account.id },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(409)
      })

    })

    test('Should fail if an invalid accountId is used', async () => {
      const response = await axios.post(
        `http://localhost:${appContainer.port}/otp`,
        { accountId: 11111 },
        { headers: { authorization: 'Bearer user1token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(400)
      })
    })

    test("Should fail if an invalid user is used", async () => {
      const response = await axios.post(
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
      const response = await axios.get(
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
      const response = await axios.get(
        `http://localhost:${appContainer.port}/otp`,
        { headers: { authorization: 'Bearer user3token' } }
      ).catch(error => {
        expect(error.response.status).toEqual(401)
      })

    })
  })
})
