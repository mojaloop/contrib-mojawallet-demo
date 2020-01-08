import got from 'got'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Health API Test', () => {

  let appContainer: TestAppContainer

  beforeAll(async () => {
    appContainer = createTestApp()
  })

  afterAll(() => {
    appContainer.server.close()
  })

  it('Can hit health endpoint', async () => {
    const response = await got.get({
      url: `http://localhost:${appContainer.port}/healthz`
    })

    expect(response.statusCode).toBe(200)
  })
})
