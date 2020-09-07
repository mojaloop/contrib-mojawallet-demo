/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the License) and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Coil
 - Cairin Michie <cairin@coil.com>
 - Donovan Changfoot <don@coil.com>
 - Matthew de Haast <matt@coil.com>
 - Talon Patterson <talon.patterson@coil.com>
 --------------
 ******/

import axios from 'axios'
import bcrypt from 'bcrypt'
import { createTestApp, TestAppContainer } from './utils/app'

describe('Login', function () {
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

  describe('Get login request', function () {
    test('does not accept hydra login if user is not currently logged in', async () => {
      appContainer.hydraApi.getLoginRequest = jest.fn().mockResolvedValue({
        skip: false,
        request_url: 'http://auth.localhost'
      })
      appContainer.hydraApi.acceptLoginRequest = jest.fn()

      const { status } = await axios.get(`http://localhost:${appContainer.port}/login?login_challenge=test`)

      expect(status).toEqual(200)
      expect(appContainer.hydraApi.getLoginRequest).toBeCalledWith('test')
      expect(appContainer.hydraApi.acceptLoginRequest).not.toBeCalled()
    })

    test('accepts hydra login and returns a redirect url if user is logged in already', async () => {
      appContainer.hydraApi.getLoginRequest = jest.fn().mockResolvedValue({
        skip: true,
        subject: '2',
        request_url: 'http://auth.localhost'
      })
      appContainer.hydraApi.acceptLoginRequest = jest.fn().mockResolvedValue({
        redirect_to: `http://localhost:${appContainer.port}/redirect`
      })

      const { status, data } = await axios.get(`http://localhost:${appContainer.port}/login?login_challenge=test`)

      expect(appContainer.hydraApi.acceptLoginRequest).toHaveBeenCalledWith('test', { subject: '2', remember: true, remember_for: 604800 })
      expect(data.redirectTo).toEqual(`http://localhost:${appContainer.port}/redirect`)
      expect(status).toEqual(200)
    })

    test('login_challenge query parameter is required', async () => {
      try {
        await axios.get(`http://localhost:${appContainer.port}/login`)
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.errors[0].field).toBe('login_challenge')
        expect(data.errors[0].message).toBe('"login_challenge" is required')
        return
      }
      fail()
    })
  })

  describe('Post login', function () {
    test('No password gives an error', async () => {
      try {
        await axios.post(`http://localhost:${appContainer.port}/login?login_challenge=testChallenge`, {
          username: 'alice'
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe('Validation Failed')
        expect(data.errors[0].field).toBe('password')
        expect(data.errors[0].message).toBe('"password" is required')
        return
      }
      fail()
    })

    test('No login_challenge gives an error', async () => {
      try {
        await axios.post(`http://localhost:${appContainer.port}/login`, {
          username: 'alice',
          password: 'alice'
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe('Validation Failed')
        expect(data.errors[0].field).toBe('login_challenge')
        expect(data.errors[0].message).toBe('"login_challenge" is required')
        return
      }
      fail()
    })

    test('No username gives an error', async () => {
      try {
        await axios.post(`http://localhost:${appContainer.port}/login?login_challenge=testChallenge`, {
          password: 'alice'
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe('Validation Failed')
        expect(data.errors[0].field).toBe('username')
        expect(data.errors[0].message).toBe('"username" is required')
        return
      }
      fail()
    })

    test('Username doesnt exist gives an error', async () => {
      try {
        await axios.post(`http://localhost:${appContainer.port}/login?login_challenge=testChallenge`, {
          username: 'matt',
          password: 'matt'
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe('Validation Failed')
        expect(data.errors[0].field).toBe('username')
        expect(data.errors[0].message).toBe('User does not exist')
        return
      }
      fail()
    })

    test('Incorrect password gives an error', async () => {
      await appContainer.userService.store({
        username: 'matt',
        password: 'notmypassword'
      })

      try {
        await axios.post(`http://localhost:${appContainer.port}/login?login_challenge=testChallenge`, {
          username: 'matt',
          password: 'matt'
        })
      } catch (error) {
        expect(error.response.status).toEqual(422)

        const data = error.response.data
        expect(data.message).toBe('Validation Failed')
        expect(data.errors[0].field).toBe('password')
        expect(data.errors[0].message).toBe('Invalid password')
        return
      }
      fail()
    })
  })

  describe('valid user credentials', function () {
    test('accepts hydra login', async () => {
      appContainer.hydraApi.acceptLoginRequest = jest.fn().mockResolvedValue({
        redirect_to: `http://localhost:${appContainer.port}/redirect`
      })
      const user = await appContainer.userService.store({ username: 'alice', password: await bcrypt.hash('test', await bcrypt.genSalt()) })

      await axios.post(`http://localhost:${appContainer.port}/login?login_challenge=testChallenge`, { username: 'alice', password: 'test' })

      expect(appContainer.hydraApi.acceptLoginRequest).toHaveBeenCalledWith('testChallenge', { subject: user.id.toString(),
remember: true,
        remember_for: 604800 })
    })
  })
})
