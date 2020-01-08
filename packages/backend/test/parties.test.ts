import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Parties Request Test', () => {
  let appContainer: TestAppContainer

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  beforeEach(async () => {
    await appContainer.knex.migrate.latest()
    await appContainer.userService.store({
      username: '+27123456789',
      password: 'password'
    })
  })

  afterEach(async () => {
    await appContainer.knex.migrate.rollback()
  })

  afterAll(() => {
    appContainer.server.close()
    appContainer.knex.destroy()
  })

  describe('Handling a parties get request', () => {
    test('Can retrieve a valid parties request and returns 200', async () => {
      const mock = jest.fn()
      appContainer.mojaloopRequests.putParties = mock
      const response = await axios.get(`http://localhost:${appContainer.port}/parties/msisdn/27123456789`, {
        headers: {
          'fspiop-source': 'MobileMoney',
          'fspiop-destination': 'mojawallet'
        }
      })
      expect(response.status).toEqual(200)
      expect(mock).toHaveBeenCalledWith('MSISDN', '27123456789', {
        party: {
          partyIdInfo: {
            partyIdType: 'MSISDN',
            partyIdentifier: '27123456789',
            fspId: 'mojawallet'
          }
        }
      }, 'MobileMoney')
    })
  })
})
