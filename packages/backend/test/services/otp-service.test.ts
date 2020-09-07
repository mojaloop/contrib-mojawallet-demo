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

import Knex from 'knex'
import { Otp, KnexOtpService, OtpTools, OtpProps } from '../../src/services/otp-service'

describe('Otp Service', () => {
  let knex: Knex
  let otpService: KnexOtpService
  let otpObject: Otp

  beforeAll(async () => {
    knex = Knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        supportBigNumbers: true
      }
    })
    otpObject = {
      userId: '0123456789',
      accountId: 'accountId',
      expiresAt: 1234567890,
      isUsed: false,
      otp: '1234'
    }
    otpService = new KnexOtpService(knex)
  })

  beforeEach(async () => {
    await knex.migrate.latest()
  })

  afterEach(async () => {
    await knex.migrate.rollback()
  })

  afterAll(async () => {
    await knex.destroy()
  })

  describe('Tests handling storage of otp', () => {
    test('Should write an otp object to mojaOtp', async () => {
      await otpService.add(otpObject)
      const storedOtp = await knex('mojaOtp').first()

      expect(storedOtp).toBeDefined()
    })

    test('Should retrieve a list of otps from mojaOtp by userId', async () => {
      await knex('mojaOtp').insert({
        userId: '0123456789',
        accountId: 'accountId',
        expiresAt: 1234567890,
        isUsed: false,
        otp: '1234'
      })
      const retrievedOtp = await otpService.get('0123456789')

      expect(retrievedOtp).toBeDefined()
      if (retrievedOtp) {
        expect(retrievedOtp[0].userId).toEqual('0123456789')
      }
    })

    test('Should retrieve an active otp from mojaOtp by userId', async () => {
      await knex('mojaOtp').insert({
        userId: '0123456789',
        accountId: 'accountId',
        expiresAt: Math.floor((Date.now() + (5 * 1000 * 60)) / 1000),
        isUsed: false,
        otp: '1234'
      })
      const retrievedOtp = await otpService.getActiveOtp('0123456789')
      await knex('mojaOtp').insert({
        userId: '1111111111',
        accountId: 'accountId',
        expiresAt: Math.floor((Date.now() + (5 * 1000 * 60)) / 1000),
        isUsed: true,
        otp: '1234'
      })
      const retrievedOtp2 = await otpService.getActiveOtp('1111111111')

      expect(retrievedOtp).toBeDefined()
      if (retrievedOtp) {
        expect(retrievedOtp.userId).toEqual('0123456789')
      }
      expect(retrievedOtp2).toBeUndefined()
    })

    test('Should update an otp', async () => {
      await knex('mojaOtp').insert({
        userId: '0123456789',
        accountId: 'accountId',
        expiresAt: Math.floor((Date.now() + (5 * 1000 * 60)) / 1000),
        isUsed: false,
        otp: '1234'
      })

      const otpProps: OtpProps = {
        userId: '0123456789',
        isUsed: true,
        expiresAt: Date.now() / 1000
      }

      try {
        await otpService.update(otpProps)
      } catch (error) {
        expect(error).toBeUndefined()
      }
    })
  })

  describe('Tests handling otp tools', () => {
    test('Should generate a valid otp object', async () => {
      const userId = '0123456789'
      const accountId = 'accountId'
      const otpTools = new OtpTools(userId, accountId)
      const generatedOtpObject = otpTools.getOtp()

      expect(generatedOtpObject).toBeDefined()
      expect(generatedOtpObject.isUsed).toEqual(false)
      expect(generatedOtpObject.expiresAt).toBeGreaterThan(Math.floor((new Date(Date.now()).getTime()) / 1000))
      expect(generatedOtpObject.otp).toMatch(new RegExp(/^[0-9]{4}$/))
    })
  })
})
