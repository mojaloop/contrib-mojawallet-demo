import axios from 'axios'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Participants Request Test', () => {
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

  describe('Handling a authorization error response', () => {
    
    test('Handling a failed response', async () => {
      const response = await axios.put(`http://localhost:${appContainer.port}/authorizations/1234567890/error`)
      expect(response.status).toEqual(200)
    })

  })
})
